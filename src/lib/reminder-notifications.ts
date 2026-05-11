import type { TimeFieldKey } from "@/types/notification-settings";

export type ReminderKind = TimeFieldKey | "water_reminder";

export interface ReminderTemplate {
    title: string;
    body: string;
    icon: string;
    url: string;
}

export const REMINDER_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const REMINDER_TEMPLATES: Record<ReminderKind, ReminderTemplate> = {
    breakfast_time: {
        title: "🌅 Đến giờ ăn sáng!",
        body: "Bắt đầu ngày mới với bữa sáng đầy năng lượng nhé!",
        icon: "/icons/icon-192x192.png",
        url: "/",
    },
    lunch_time: {
        title: "☀️ Đến giờ ăn trưa!",
        body: "Nạp năng lượng cho buổi chiều. Ăn đúng bữa nhé!",
        icon: "/icons/icon-192x192.png",
        url: "/",
    },
    dinner_time: {
        title: "🌙 Đến giờ ăn tối!",
        body: "Bữa tối nhẹ nhàng giúp bạn nghỉ ngơi tốt hơn.",
        icon: "/icons/icon-192x192.png",
        url: "/",
    },
    snack_time: {
        title: "🍎 Giờ ăn phụ!",
        body: "Một bữa nhẹ giúp duy trì năng lượng suốt cả ngày.",
        icon: "/icons/icon-192x192.png",
        url: "/",
    },
    workout_time: {
        title: "🏋️ Đến giờ tập luyện!",
        body: "Hãy vận động để khoẻ mạnh hơn mỗi ngày!",
        icon: "/icons/icon-192x192.png",
        url: "/",
    },
    water_reminder: {
        title: "💧 Nhắc uống nước!",
        body: "Đừng quên uống nước đều đặn để giữ cơ thể khoẻ mạnh.",
        icon: "/icons/icon-192x192.png",
        url: "/",
    },
};

export function getCurrentReminderTime(date = new Date()): string {
    return new Intl.DateTimeFormat("en-GB", {
        timeZone: REMINDER_TIME_ZONE,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    }).format(date);
}

export function normalizeReminderTime(time: string): string {
    const [hours = "00", minutes = "00"] = time.split(":");
    return `${hours.padStart(2, "0")}:${minutes.padStart(2, "0")}`;
}

export function getReminderDateKey(date = new Date()): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
        timeZone: REMINDER_TIME_ZONE,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);

    const year = parts.find((part) => part.type === "year")?.value ?? "0000";
    const month = parts.find((part) => part.type === "month")?.value ?? "00";
    const day = parts.find((part) => part.type === "day")?.value ?? "00";

    return `${year}-${month}-${day}`;
}
