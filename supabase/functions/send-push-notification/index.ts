// supabase/functions/send-push-notification/index.ts
//
// Supabase Edge Function — Push Notification Hub
//
// Handles 3 actions:
// 1. "send-notification"      — Webhook từ bảng notifications (INSERT trigger)
// 2. "cron-check-reminders"   — pg_cron gọi mỗi phút để check & gửi nhắc nhở
// 3. (legacy) webhook payload — Nếu có record.user_id thì gửi trực tiếp

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import webpush from 'https://esm.sh/web-push@3.6.7'

// ─── Cấu hình VAPID ─────────────────────────────────────────────────────────
const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY') || ''
const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY') || ''
const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:nguyenduongit89@gmail.com'

webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey)

// ─── Supabase admin client (service_role) ────────────────────────────────────
const supabaseAdmin = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// ─── Reminder Templates ─────────────────────────────────────────────────────
const REMINDER_TEMPLATES: Record<string, { title: string; body: string; icon: string; url: string }> = {
  breakfast_time: {
    title: '🌅 Đến giờ ăn sáng!',
    body: 'Bắt đầu ngày mới với bữa sáng đầy năng lượng nhé!',
    icon: '/icons/icon-192x192.png',
    url: '/',
  },
  lunch_time: {
    title: '☀️ Đến giờ ăn trưa!',
    body: 'Nạp năng lượng cho buổi chiều. Ăn đúng bữa nhé!',
    icon: '/icons/icon-192x192.png',
    url: '/',
  },
  dinner_time: {
    title: '🌙 Đến giờ ăn tối!',
    body: 'Bữa tối nhẹ nhàng giúp bạn nghỉ ngơi tốt hơn.',
    icon: '/icons/icon-192x192.png',
    url: '/',
  },
  snack_time: {
    title: '🍎 Giờ ăn phụ!',
    body: 'Một bữa nhẹ giúp duy trì năng lượng suốt cả ngày.',
    icon: '/icons/icon-192x192.png',
    url: '/',
  },
  workout_time: {
    title: '🏋️ Đến giờ tập luyện!',
    body: 'Hãy vận động để khoẻ mạnh hơn mỗi ngày!',
    icon: '/icons/icon-192x192.png',
    url: '/',
  },
  water_reminder: {
    title: '💧 Nhắc uống nước!',
    body: 'Đừng quên uống nước đều đặn để giữ cơ thể khoẻ mạnh.',
    icon: '/icons/icon-192x192.png',
    url: '/',
  },
}

const TIME_FIELDS = ['breakfast_time', 'lunch_time', 'dinner_time', 'snack_time', 'workout_time']

// ─── Helper: Lấy giờ hiện tại theo Asia/Ho_Chi_Minh (HH:MM) ────────────────
function getCurrentTimeVN(): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date())
}

// ─── Helper: Lấy ngày hiện tại theo Asia/Ho_Chi_Minh (YYYY-MM-DD) ──────────
function getCurrentDateVN(): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date())

  const year = parts.find((p) => p.type === 'year')?.value ?? '0000'
  const month = parts.find((p) => p.type === 'month')?.value ?? '00'
  const day = parts.find((p) => p.type === 'day')?.value ?? '00'
  return `${year}-${month}-${day}`
}

// ─── Helper: Gửi push notification đến tất cả devices của 1 user ───────────
interface PushResult {
  userId: string
  sent: number
  failed: number
  cleaned: number
}

async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; icon?: string; url?: string }
): Promise<PushResult> {
  const { data: subs, error } = await supabaseAdmin
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('user_id', userId)

  if (error) throw error
  if (!subs || subs.length === 0) {
    return { userId, sent: 0, failed: 0, cleaned: 0 }
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    icon: payload.icon || '/icons/icon-192x192.png',
    url: payload.url || '/',
  })

  const results = await Promise.allSettled(
    subs.map((sub) =>
      webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        notificationPayload
      )
    )
  )

  // Xoá subscriptions hết hạn (status 410)
  const expiredEndpoints = results
    .map((r, i) => {
      if (r.status === 'rejected' && r.reason?.statusCode === 410) {
        return subs[i].endpoint
      }
      return null
    })
    .filter(Boolean) as string[]

  if (expiredEndpoints.length > 0) {
    await supabaseAdmin
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .in('endpoint', expiredEndpoints)
  }

  const sent = results.filter((r) => r.status === 'fulfilled').length
  const failed = results.filter((r) => r.status === 'rejected').length

  return { userId, sent, failed, cleaned: expiredEndpoints.length }
}

// ─── Helper: Kiểm tra đã gửi reminder cho user hôm nay chưa ────────────────
async function wasReminderSentToday(
  userId: string,
  reminderType: string,
  reminderTime: string
): Promise<boolean> {
  const today = getCurrentDateVN()

  const { data } = await supabaseAdmin
    .from('notification_log')
    .select('id')
    .eq('user_id', userId)
    .eq('reminder_type', reminderType)
    .eq('reminder_time', reminderTime)
    .eq('sent_date', today)
    .limit(1)

  return (data && data.length > 0) || false
}

// ─── Helper: Ghi log đã gửi reminder ───────────────────────────────────────
async function logReminderSent(
  userId: string,
  reminderType: string,
  reminderTime: string
): Promise<void> {
  const today = getCurrentDateVN()

  await supabaseAdmin.from('notification_log').upsert(
    {
      user_id: userId,
      reminder_type: reminderType,
      reminder_time: reminderTime,
      sent_date: today,
    },
    { onConflict: 'user_id,reminder_type,reminder_time,sent_date' }
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN HANDLER
// ═══════════════════════════════════════════════════════════════════════════════
Deno.serve(async (req) => {
  try {
    const payload = await req.json()
    const action = payload.action || (payload.record ? 'send-notification' : 'unknown')

    console.log(`📬 Action: ${action}`)

    // ─── Action: cron-check-reminders ──────────────────────────────────
    // Gọi bởi pg_cron mỗi phút → check giờ hiện tại → gửi push cho users
    if (action === 'cron-check-reminders') {
      const currentTime = getCurrentTimeVN()
      console.log(`⏰ Cron check at ${currentTime} (Asia/Ho_Chi_Minh)`)

      let totalSent = 0
      let totalUsers = 0

      // 1. Kiểm tra notification_settings — giờ ăn / tập
      for (const field of TIME_FIELDS) {
        const { data: matchingUsers } = await supabaseAdmin
          .from('notification_settings')
          .select('user_id')
          .eq('notifications_enabled', true)
          .eq(field, currentTime)

        if (matchingUsers && matchingUsers.length > 0) {
          const template = REMINDER_TEMPLATES[field]
          for (const row of matchingUsers) {
            // Kiểm tra dedup: đã gửi hôm nay chưa?
            const alreadySent = await wasReminderSentToday(row.user_id, field, currentTime)
            if (alreadySent) {
              console.log(`⏭ Skipped ${field} for user ${row.user_id} (already sent today)`)
              continue
            }

            const result = await sendPushToUser(row.user_id, template)
            if (result.sent > 0) {
              await logReminderSent(row.user_id, field, currentTime)
              totalSent += result.sent
              totalUsers++
            }
            console.log(`📤 ${field}: user ${row.user_id} → sent ${result.sent}, failed ${result.failed}`)
          }
        }
      }

      // 2. Kiểm tra water_schedules — giờ uống nước
      const { data: waterMatches } = await supabaseAdmin
        .from('water_schedules')
        .select('user_id')
        .eq('time', currentTime)

      if (waterMatches && waterMatches.length > 0) {
        const uniqueUserIds = [...new Set(waterMatches.map((w) => w.user_id))]
        const template = REMINDER_TEMPLATES.water_reminder

        for (const userId of uniqueUserIds) {
          const dedupeKey = `water_${currentTime}`
          const alreadySent = await wasReminderSentToday(userId, 'water_reminder', currentTime)
          if (alreadySent) {
            console.log(`⏭ Skipped water_reminder for user ${userId} (already sent today)`)
            continue
          }

          const result = await sendPushToUser(userId, template)
          if (result.sent > 0) {
            await logReminderSent(userId, 'water_reminder', currentTime)
            totalSent += result.sent
            totalUsers++
          }
          console.log(`💧 water: user ${userId} → sent ${result.sent}, failed ${result.failed}`)
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          action: 'cron-check-reminders',
          time: currentTime,
          totalUsers,
          totalSent,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── Action: send-notification ─────────────────────────────────────
    // Gọi bởi webhook trigger khi INSERT vào bảng notifications
    if (action === 'send-notification') {
      const record = payload.record
      if (!record || !record.user_id) {
        return new Response(JSON.stringify({ error: 'Invalid record: missing user_id' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        })
      }

      const { user_id, title, body, data } = record

      const result = await sendPushToUser(user_id, {
        title: title || 'Thông báo mới',
        body: body || '',
        icon: '/icons/icon-192x192.png',
        url: data?.url || '/',
      })

      // Đánh dấu đã gửi
      await supabaseAdmin
        .from('notifications')
        .update({ sent: true, updated_at: new Date().toISOString() })
        .eq('id', record.id)

      console.log(`✅ Notification sent to user ${user_id}: ${result.sent} devices`)

      return new Response(
        JSON.stringify({
          success: true,
          action: 'send-notification',
          ...result,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ─── Fallback: Legacy webhook payload ──────────────────────────────
    // Hỗ trợ payload cũ: { record: { user_id, title, body, data } }
    if (payload.record && payload.record.user_id) {
      const { user_id, title, body, data } = payload.record

      const result = await sendPushToUser(user_id, {
        title: title || 'Thông báo mới',
        body: body || '',
        url: data?.url || '/',
      })

      return new Response(JSON.stringify({ success: true, ...result }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('❌ Error in send-push-notification:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})