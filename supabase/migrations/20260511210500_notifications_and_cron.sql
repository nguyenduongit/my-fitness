-- ═══════════════════════════════════════════════════════════════════════════════
-- Migration: Push Notifications via Supabase pg_cron + Edge Function
-- 
-- This migration creates:
-- 1. notifications table — for direct push messages (webhook-triggered)
-- 2. notification_log table — to deduplicate cron-based reminders (1 per day/type)
-- 3. pg_cron job — runs every minute, calls the Edge Function to send due reminders
-- ═══════════════════════════════════════════════════════════════════════════════

-- ─── 1. Notifications table (for webhook-based push) ─────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Thông báo mới',
    body TEXT DEFAULT '',
    data JSONB DEFAULT '{}',
    sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: users can read their own notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notifications"
    ON notifications FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for webhook trigger lookup
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);

-- ─── 2. Notification log (deduplication for cron reminders) ──────────────────
CREATE TABLE IF NOT EXISTS notification_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reminder_type TEXT NOT NULL,       -- e.g. 'breakfast_time', 'water_reminder'
    reminder_time TEXT NOT NULL,       -- e.g. '07:00'
    sent_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, reminder_type, reminder_time, sent_date)
);

-- RLS
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification_log"
    ON notification_log FOR SELECT
    USING (auth.uid() = user_id);

-- Index for fast dedup check
CREATE INDEX IF NOT EXISTS idx_notification_log_lookup
    ON notification_log(user_id, reminder_type, reminder_time, sent_date);

-- Auto-cleanup old logs (keep last 7 days)
-- This will be handled by a separate cron job

-- ─── 3. Enable pg_cron and pg_net extensions ─────────────────────────────────
-- pg_cron: for scheduled jobs
-- pg_net: for making HTTP requests from within PostgreSQL
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ─── 4. Create the cron job ─────────────────────────────────────────────────
-- Runs every minute, calls the Edge Function to check and send due reminders
SELECT cron.schedule(
    'send-push-reminders',          -- job name
    '* * * * *',                    -- every minute
    $$
    SELECT net.http_post(
        url := 'https://zuexxflzruzkfqfoylgl.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'action', 'cron-check-reminders'
        )
    );
    $$
);

-- ─── 5. Cleanup old notification logs (daily at 3 AM) ────────────────────────
SELECT cron.schedule(
    'cleanup-notification-logs',
    '0 3 * * *',                    -- daily at 3 AM
    $$
    DELETE FROM notification_log WHERE sent_date < CURRENT_DATE - INTERVAL '7 days';
    $$
);

-- ─── 6. Webhook trigger: auto-send push when new notification inserted ───────
CREATE OR REPLACE FUNCTION trigger_send_push_notification()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM net.http_post(
        url := 'https://zuexxflzruzkfqfoylgl.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json'
        ),
        body := jsonb_build_object(
            'action', 'send-notification',
            'record', row_to_json(NEW)
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_notification
    AFTER INSERT ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION trigger_send_push_notification();
