import { supabase } from "./supabase";
import { DailyCompletion, DailyCompletionInsert } from "@/types/completion";

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Lấy tất cả completions của ngày */
export async function getCompletionsByDate(
    date: string
): Promise<DailyCompletion[]> {
    const { data, error } = await supabase
        .from("daily_completions")
        .select("*")
        .eq("date", date);

    if (error) throw error;
    return data ?? [];
}

/** Lấy completions trong khoảng ngày (cho streak / lịch sử) */
export async function getCompletionsInRange(
    startDate: string,
    endDate: string
): Promise<DailyCompletion[]> {
    const { data, error } = await supabase
        .from("daily_completions")
        .select("*")
        .gte("date", startDate)
        .lte("date", endDate)
        .order("date", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Đánh dấu hoàn thành 1 mục (bữa ăn hoặc buổi tập) */
export async function markCompleted(
    item: DailyCompletionInsert
): Promise<DailyCompletion> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("daily_completions")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Huỷ đánh dấu hoàn thành (nếu đánh dấu nhầm) */
export async function unmarkCompleted(
    date: string,
    type: string,
    referenceKey: string
): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { error } = await supabase
        .from("daily_completions")
        .delete()
        .eq("user_id", user.id)
        .eq("date", date)
        .eq("type", type)
        .eq("reference_key", referenceKey);

    if (error) throw error;
}

/** Toggle completion: đánh dấu nếu chưa, huỷ nếu đã đánh dấu */
export async function toggleCompletion(
    date: string,
    type: "meal" | "workout",
    referenceKey: string,
    currentlyCompleted: boolean
): Promise<DailyCompletion | null> {
    if (currentlyCompleted) {
        await unmarkCompleted(date, type, referenceKey);
        return null;
    } else {
        return await markCompleted({ date, type, reference_key: referenceKey });
    }
}
