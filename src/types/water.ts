// ─── Water Schedule & Log Types ──────────────────────────────────────────────
// Lịch uống nước + nhật ký uống nước hàng ngày

export interface WaterSchedule {
    id: string;
    user_id: string;
    time: string;         // "HH:MM" format
    amount_ml: number;
    label: string | null;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export type WaterScheduleInsert = Omit<
    WaterSchedule,
    "id" | "user_id" | "created_at" | "updated_at"
>;

export interface WaterLog {
    id: string;
    user_id: string;
    date: string;          // YYYY-MM-DD
    schedule_id: string | null;
    amount_ml: number;
    logged_at: string;
}

export type WaterLogInsert = Omit<
    WaterLog,
    "id" | "user_id" | "logged_at"
>;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_WATER_SCHEDULES: Omit<WaterScheduleInsert, "order_index">[] = [
    { time: "07:00", amount_ml: 300, label: "Sau khi thức dậy" },
    { time: "09:00", amount_ml: 250, label: "Giữa buổi sáng" },
    { time: "11:30", amount_ml: 250, label: "Trước bữa trưa" },
    { time: "14:00", amount_ml: 250, label: "Đầu buổi chiều" },
    { time: "16:00", amount_ml: 250, label: "Giữa buổi chiều" },
    { time: "18:00", amount_ml: 200, label: "Trước bữa tối" },
    { time: "20:00", amount_ml: 250, label: "Buổi tối" },
    { time: "21:30", amount_ml: 200, label: "Trước khi ngủ" },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Tính tổng lượng nước đã uống trong ngày */
export function getTotalWaterLogged(logs: WaterLog[]): number {
    return logs.reduce((sum, log) => sum + log.amount_ml, 0);
}

/** Kiểm tra 1 mốc đã uống chưa */
export function isWaterScheduleLogged(
    logs: WaterLog[],
    scheduleId: string
): boolean {
    return logs.some((log) => log.schedule_id === scheduleId);
}
