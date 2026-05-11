import { supabase } from "./supabase";
import {
    NotificationSettings,
    NotificationSettingsUpsert,
    DEFAULT_NOTIFICATION_SETTINGS,
} from "@/types/notification-settings";

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Lấy cài đặt thông báo của user (trả về default nếu chưa có) */
export async function getNotificationSettings(): Promise<NotificationSettingsUpsert> {
    const { data, error } = await supabase
        .from("notification_settings")
        .select("*")
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        return { ...DEFAULT_NOTIFICATION_SETTINGS };
    }

    return {
        breakfast_time: data.breakfast_time,
        lunch_time: data.lunch_time,
        dinner_time: data.dinner_time,
        snack_time: data.snack_time,
        workout_time: data.workout_time,
        reminder_delay_minutes: data.reminder_delay_minutes,
        notifications_enabled: true,
    };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Lưu hoặc cập nhật cài đặt thông báo (upsert) */
export async function saveNotificationSettings(
    settings: NotificationSettingsUpsert
): Promise<NotificationSettings> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    // Upsert: insert nếu chưa có, update nếu đã có
    const { data, error } = await supabase
        .from("notification_settings")
        .upsert(
            {
                user_id: user.id,
                ...settings,
                notifications_enabled: true,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}
