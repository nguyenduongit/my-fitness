import { supabase } from "./supabase";
import {
    WaterSchedule,
    WaterScheduleInsert,
    WaterLog,
    WaterLogInsert,
} from "@/types/water";

// ═══════════════════════════════════════════════════════════════════════════════
// Water Schedules
// ═══════════════════════════════════════════════════════════════════════════════

/** Lấy tất cả mốc uống nước của user */
export async function getWaterSchedules(): Promise<WaterSchedule[]> {
    const { data, error } = await supabase
        .from("water_schedules")
        .select("*")
        .order("order_index", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

/** Thêm mốc uống nước */
export async function addWaterSchedule(
    item: WaterScheduleInsert
): Promise<WaterSchedule> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("water_schedules")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Cập nhật mốc uống nước */
export async function updateWaterSchedule(
    id: string,
    updates: Partial<WaterScheduleInsert>
): Promise<WaterSchedule> {
    const { data, error } = await supabase
        .from("water_schedules")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Xoá mốc uống nước */
export async function deleteWaterSchedule(id: string): Promise<void> {
    const { error } = await supabase
        .from("water_schedules")
        .delete()
        .eq("id", id);
    if (error) throw error;
}

/** Thay thế toàn bộ lịch uống nước (xoá cũ, thêm mới) */
export async function replaceAllWaterSchedules(
    items: Omit<WaterScheduleInsert, "order_index">[]
): Promise<WaterSchedule[]> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    // Xoá tất cả
    const { error: delError } = await supabase
        .from("water_schedules")
        .delete()
        .eq("user_id", user.id);
    if (delError) throw delError;

    if (items.length === 0) return [];

    // Thêm mới với order_index
    const inserts = items.map((item, idx) => ({
        ...item,
        user_id: user.id,
        order_index: idx,
    }));

    const { data, error } = await supabase
        .from("water_schedules")
        .insert(inserts)
        .select();

    if (error) throw error;
    return data ?? [];
}

// ═══════════════════════════════════════════════════════════════════════════════
// Water Logs
// ═══════════════════════════════════════════════════════════════════════════════

/** Lấy nhật ký uống nước theo ngày */
export async function getWaterLogsByDate(date: string): Promise<WaterLog[]> {
    const { data, error } = await supabase
        .from("water_logs")
        .select("*")
        .eq("date", date);

    if (error) throw error;
    return data ?? [];
}

/** Đánh dấu đã uống nước tại 1 mốc */
export async function logWater(
    item: WaterLogInsert
): Promise<WaterLog> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("water_logs")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Huỷ đánh dấu uống nước */
export async function unlogWater(
    date: string,
    scheduleId: string
): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { error } = await supabase
        .from("water_logs")
        .delete()
        .eq("user_id", user.id)
        .eq("date", date)
        .eq("schedule_id", scheduleId);

    if (error) throw error;
}

/** Toggle uống nước */
export async function toggleWaterLog(
    date: string,
    scheduleId: string,
    amountMl: number,
    currentlyLogged: boolean
): Promise<WaterLog | null> {
    if (currentlyLogged) {
        await unlogWater(date, scheduleId);
        return null;
    } else {
        return await logWater({
            date,
            schedule_id: scheduleId,
            amount_ml: amountMl,
        });
    }
}
