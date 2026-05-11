-- ============================================================================
-- MyFitness v3 Migration
-- Thêm: user_profiles, nutrition_goals, water_schedules, water_logs,
--        push_subscriptions
-- ============================================================================

-- ─── 1. Bảng user_profiles ──────────────────────────────────────────────────
-- Thông tin cá nhân + chỉ số cơ thể

CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Thông tin cơ bản
    age INTEGER CHECK (age > 0 AND age < 200),
    gender TEXT CHECK (gender IN ('male', 'female', 'other')),
    height_cm REAL CHECK (height_cm > 0),      -- cm
    weight_kg REAL CHECK (weight_kg > 0),       -- kg

    -- Số đo cơ thể (cm)
    chest_cm REAL,
    waist_cm REAL,
    hip_cm REAL,
    bicep_cm REAL,
    thigh_cm REAL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id)
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON user_profiles FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
    ON user_profiles FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ─── 2. Bảng nutrition_goals ────────────────────────────────────────────────
-- Mục tiêu dinh dưỡng hàng ngày

CREATE TABLE IF NOT EXISTS nutrition_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    calories INTEGER NOT NULL DEFAULT 2000,
    protein_g REAL NOT NULL DEFAULT 150,
    carbs_g REAL NOT NULL DEFAULT 200,
    fat_g REAL NOT NULL DEFAULT 65,
    water_ml INTEGER NOT NULL DEFAULT 2000,    -- mục tiêu nước (ml)

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id)
);

ALTER TABLE nutrition_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own nutrition goals"
    ON nutrition_goals FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own nutrition goals"
    ON nutrition_goals FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own nutrition goals"
    ON nutrition_goals FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);


-- ─── 3. Bảng water_schedules ────────────────────────────────────────────────
-- Lịch uống nước trong ngày (nhiều mốc thời gian)

CREATE TABLE IF NOT EXISTS water_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    time TIME NOT NULL,               -- Giờ uống (VD: 08:00)
    amount_ml INTEGER NOT NULL DEFAULT 250,  -- Lượng nước (ml)
    label TEXT,                        -- Nhãn tuỳ chọn (VD: "Sau khi thức dậy")
    order_index INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_water_schedules_user
    ON water_schedules(user_id, order_index);

ALTER TABLE water_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water schedules"
    ON water_schedules FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water schedules"
    ON water_schedules FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own water schedules"
    ON water_schedules FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water schedules"
    ON water_schedules FOR DELETE
    USING (auth.uid() = user_id);


-- ─── 4. Bảng water_logs ─────────────────────────────────────────────────────
-- Nhật ký uống nước hàng ngày (đánh dấu đã uống từng mốc)

CREATE TABLE IF NOT EXISTS water_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    date DATE NOT NULL,
    schedule_id UUID REFERENCES water_schedules(id) ON DELETE SET NULL,
    amount_ml INTEGER NOT NULL DEFAULT 250,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Mỗi mốc chỉ được đánh dấu 1 lần/ngày
    UNIQUE(user_id, date, schedule_id)
);

CREATE INDEX idx_water_logs_user_date
    ON water_logs(user_id, date);

ALTER TABLE water_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own water logs"
    ON water_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own water logs"
    ON water_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own water logs"
    ON water_logs FOR DELETE
    USING (auth.uid() = user_id);


-- ─── 5. Bảng push_subscriptions ─────────────────────────────────────────────
-- Lưu push subscription để backend gửi thông báo

CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    endpoint TEXT NOT NULL,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE(user_id, endpoint)
);

ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own push subscriptions"
    ON push_subscriptions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own push subscriptions"
    ON push_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own push subscriptions"
    ON push_subscriptions FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own push subscriptions"
    ON push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);


-- ============================================================================
-- Xong! Chạy migration này trong Supabase SQL Editor.
-- ============================================================================
