import { supabase } from "./supabase";
import { WorkoutSession, WorkoutSessionInsert } from "@/types/schedule";

/** Lấy toàn bộ lịch tập (tất cả tuần) của user hiện tại */
export async function getWorkoutSessions(): Promise<WorkoutSession[]> {
    const { data, error } = await supabase
        .from("workout_sessions")
        .select("*")
        .order("week_number", { ascending: true })
        .order("day_of_week", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

/** Tạo buổi tập mới */
export async function createWorkoutSession(
    session: WorkoutSessionInsert
): Promise<WorkoutSession> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("workout_sessions")
        .insert({ ...session, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Cập nhật buổi tập (title, note, exercises, is_rest_day) */
export async function updateWorkoutSession(
    id: string,
    updates: Partial<WorkoutSessionInsert>
): Promise<WorkoutSession> {
    const { data, error } = await supabase
        .from("workout_sessions")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Xoá buổi tập */
export async function deleteWorkoutSession(id: string): Promise<void> {
    const { error } = await supabase
        .from("workout_sessions")
        .delete()
        .eq("id", id);
    if (error) throw error;
}