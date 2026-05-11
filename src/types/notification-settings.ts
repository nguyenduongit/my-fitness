// ─── Notification Settings Types ─────────────────────────────────────────────
// Cài đặt giờ thông báo nhắc nhở

export interface NotificationSettings {
    id: string;
    user_id: string;
    breakfast_time: string; // "HH:MM" format
    lunch_time: string;
    dinner_time: string;
    snack_time: string;
    workout_time: string;
    reminder_delay_minutes: number; // Nhắc lại sau X phút
    notifications_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export type NotificationSettingsUpsert = Omit<
    NotificationSettings,
    "id" | "user_id" | "created_at" | "updated_at"
>;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettingsUpsert = {
    breakfast_time: "07:00",
    lunch_time: "12:00",
    dinner_time: "18:00",
    snack_time: "15:00",
    workout_time: "17:15",
    reminder_delay_minutes: 45,
    notifications_enabled: true,
};

// ─── Labels ──────────────────────────────────────────────────────────────────

export const TIME_FIELD_LABELS: Record<string, string> = {
    breakfast_time: "Giờ ăn sáng",
    lunch_time: "Giờ ăn trưa",
    dinner_time: "Giờ ăn tối",
    snack_time: "Giờ ăn phụ",
    workout_time: "Giờ tập luyện",
};

export const TIME_FIELD_ICONS: Record<string, string> = {
    breakfast_time: "🌅",
    lunch_time: "☀️",
    dinner_time: "🌙",
    snack_time: "🍎",
    workout_time: "🏋️",
};

export type TimeFieldKey = keyof Pick<
    NotificationSettings,
    "breakfast_time" | "lunch_time" | "dinner_time" | "snack_time" | "workout_time"
>;

export const TIME_FIELDS: TimeFieldKey[] = [
    "breakfast_time",
    "lunch_time",
    "dinner_time",
    "snack_time",
    "workout_time",
];
