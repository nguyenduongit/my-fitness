-- ============================================================================
-- MyFitness v2 Migration
-- Chuyển từ mô hình "nhật ký hàng ngày" sang "kế hoạch cố định + đánh dấu hoàn thành"
-- ============================================================================

-- ─── 1. Xoá bảng food_items cũ ──────────────────────────────────────────────

DROP POLICY IF EXISTS "Users can view own food items" ON food_items;
DROP POLICY IF EXISTS "Users can insert own food items" ON food_items;
DROP POLICY IF EXISTS "Users can update own food items" ON food_items;
DROP POLICY IF EXISTS "Users can delete own food items" ON food_items;
DROP TABLE IF EXISTS food_items;

-- ─── 2. Tạo bảng meal_plan_items ────────────────────────────────────────────
-- Thực đơn cố định theo thứ trong tuần (không thay đổi theo tuần)

CREATE TABLE IF NOT EXISTS meal_plan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    -- 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    name TEXT NOT NULL,
    calories INTEGER NOT NULL DEFAULT 0,
    protein REAL NOT NULL DEFAULT 0,
    carbs REAL NOT NULL DEFAULT 0,
    fat REAL NOT NULL DEFAULT 0,
    quantity REAL NOT NULL DEFAULT 1,
    unit TEXT NOT NULL DEFAULT 'phần',
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index cho truy vấn nhanh theo user + ngày
CREATE INDEX idx_meal_plan_items_user_day 
    ON meal_plan_items(user_id, day_of_week);

-- RLS
ALTER TABLE meal_plan_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meal plans"
    ON meal_plan_items FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meal plans"
    ON meal_plan_items FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own meal plans"
    ON meal_plan_items FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own meal plans"
    ON meal_plan_items FOR DELETE
    USING (auth.uid() = user_id);


-- ─── 3. Tạo bảng daily_completions ──────────────────────────────────────────
-- Theo dõi hoàn thành bữa ăn / buổi tập mỗi ngày

CREATE TABLE IF NOT EXISTS daily_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('meal', 'workout')),
    reference_key TEXT NOT NULL,
    -- Với meal: 'breakfast', 'lunch', 'dinner', 'snack'
    -- Với workout: 'workout'
    completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Mỗi mục chỉ hoàn thành 1 lần/ngày
    UNIQUE(user_id, date, type, reference_key)
);

-- Index cho truy vấn nhanh theo user + ngày
CREATE INDEX idx_daily_completions_user_date
    ON daily_completions(user_id, date);

-- RLS
ALTER TABLE daily_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions"
    ON daily_completions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions"
    ON daily_completions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own completions"
    ON daily_completions FOR DELETE
    USING (auth.uid() = user_id);


-- ─── 4. Tạo bảng notification_settings ──────────────────────────────────────
-- Cài đặt giờ thông báo nhắc nhở

CREATE TABLE IF NOT EXISTS notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    breakfast_time TIME NOT NULL DEFAULT '07:00',
    lunch_time TIME NOT NULL DEFAULT '12:00',
    dinner_time TIME NOT NULL DEFAULT '18:00',
    snack_time TIME NOT NULL DEFAULT '15:00',
    workout_time TIME NOT NULL DEFAULT '17:15',
    reminder_delay_minutes INTEGER NOT NULL DEFAULT 45,
    notifications_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Mỗi user chỉ có 1 bản cài đặt
    UNIQUE(user_id)
);

-- RLS
ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notification settings"
    ON notification_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification settings"
    ON notification_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notification settings"
    ON notification_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- ============================================================================
-- Xong! Chạy migration này trong Supabase SQL Editor.
-- ============================================================================
