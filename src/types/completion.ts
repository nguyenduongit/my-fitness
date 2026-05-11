// ─── Daily Completion Types ──────────────────────────────────────────────────
// Theo dõi hoàn thành bữa ăn / buổi tập mỗi ngày

export type CompletionType = "meal" | "workout";

export interface DailyCompletion {
    id: string;
    user_id: string;
    date: string;         // YYYY-MM-DD
    type: CompletionType;
    reference_key: string; // 'breakfast'|'lunch'|'dinner'|'snack' hoặc 'workout'
    completed_at: string;  // ISO timestamp
}

export type DailyCompletionInsert = Omit<
    DailyCompletion,
    "id" | "user_id" | "completed_at"
>;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Tạo reference key cho completion */
export const MEAL_COMPLETION_KEYS = [
    "breakfast",
    "lunch",
    "dinner",
    "snack",
] as const;

export const WORKOUT_COMPLETION_KEY = "workout" as const;

/** Kiểm tra 1 mục có hoàn thành chưa */
export function isCompleted(
    completions: DailyCompletion[],
    type: CompletionType,
    referenceKey: string
): boolean {
    return completions.some(
        (c) => c.type === type && c.reference_key === referenceKey
    );
}

/** Đếm số mục đã hoàn thành theo type */
export function countCompleted(
    completions: DailyCompletion[],
    type: CompletionType
): number {
    return completions.filter((c) => c.type === type).length;
}

/** Tổng mục tiêu cần hoàn thành trong ngày */
export function getTotalGoals(hasMeals: boolean, hasWorkout: boolean): number {
    let total = 0;
    if (hasMeals) total += 4; // 4 bữa ăn
    if (hasWorkout) total += 1; // 1 buổi tập
    return total;
}
