export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = CN, 1 = T2 ... 6 = T7

export type ExerciseCategory =
    | "chest"
    | "back"
    | "shoulders"
    | "arms"
    | "legs"
    | "core"
    | "cardio"
    | "fullbody";

export type SetType = "normal" | "warmup" | "dropset" | "failure";

export interface ExerciseSet {
    id: string;
    reps: number | null;   // null = AMRAP
    weight: number | null; // null = bodyweight, kg
    duration_sec: number | null; // for timed sets
    set_type: SetType;
    completed: boolean;
    actual_reps?: number;
    actual_weight?: number;
}

export interface Exercise {
    id: string;
    workout_id: string;
    name: string;
    description?: string;
    image_url?: string;
    category: ExerciseCategory;
    sets: ExerciseSet[];
    note?: string;
    order_index: number;
}

export interface WorkoutSession {
    id: string;
    user_id: string;
    day_of_week: DayOfWeek;
    title: string;
    note?: string;
    exercises: Exercise[];
    is_rest_day: boolean;
    week_number: number; // 1-based, e.g. 1 for week 1
    created_at: string;
    updated_at: string;
}

export type WorkoutSessionInsert = Omit<
    WorkoutSession,
    "id" | "user_id" | "created_at" | "updated_at"
>;

// ─── Constants ────────────────────────────────────────────────────────────────

export const DAY_LABELS: Record<DayOfWeek, string> = {
    0: "CN",
    1: "T2",
    2: "T3",
    3: "T4",
    4: "T5",
    5: "T6",
    6: "T7",
};

export const DAY_FULL_LABELS: Record<DayOfWeek, string> = {
    0: "Chủ nhật",
    1: "Thứ 2",
    2: "Thứ 3",
    3: "Thứ 4",
    4: "Thứ 5",
    5: "Thứ 6",
    6: "Thứ 7",
};

export const CATEGORY_LABELS: Record<ExerciseCategory, string> = {
    chest: "Ngực",
    back: "Lưng",
    shoulders: "Vai",
    arms: "Tay",
    legs: "Chân",
    core: "Bụng",
    cardio: "Cardio",
    fullbody: "Toàn thân",
};

export const CATEGORY_COLORS: Record<ExerciseCategory, string> = {
    chest: "#f87171",
    back: "#60a5fa",
    shoulders: "#a78bfa",
    arms: "#34d399",
    legs: "#fbbf24",
    core: "#fb923c",
    cardio: "#f472b6",
    fullbody: "#818cf8",
};

export const CATEGORY_ICONS: Record<ExerciseCategory, string> = {
    chest: "💪",
    back: "🏋️",
    shoulders: "🎯",
    arms: "💪",
    legs: "🦵",
    core: "🔥",
    cardio: "🏃",
    fullbody: "⚡",
};

// Gợi ý bài tập phổ biến
export const EXERCISE_SUGGESTIONS: {
    name: string;
    category: ExerciseCategory;
    default_sets: number;
    default_reps: number;
    default_weight: number | null;
}[] = [
        { name: "Bench Press", category: "chest", default_sets: 4, default_reps: 10, default_weight: 60 },
        { name: "Incline Dumbbell Press", category: "chest", default_sets: 3, default_reps: 12, default_weight: 20 },
        { name: "Push-up", category: "chest", default_sets: 3, default_reps: 15, default_weight: null },
        { name: "Pull-up", category: "back", default_sets: 4, default_reps: 8, default_weight: null },
        { name: "Barbell Row", category: "back", default_sets: 4, default_reps: 10, default_weight: 60 },
        { name: "Lat Pulldown", category: "back", default_sets: 3, default_reps: 12, default_weight: 50 },
        { name: "Overhead Press", category: "shoulders", default_sets: 4, default_reps: 10, default_weight: 40 },
        { name: "Lateral Raise", category: "shoulders", default_sets: 3, default_reps: 15, default_weight: 8 },
        { name: "Bicep Curl", category: "arms", default_sets: 3, default_reps: 12, default_weight: 12 },
        { name: "Tricep Pushdown", category: "arms", default_sets: 3, default_reps: 15, default_weight: 20 },
        { name: "Squat", category: "legs", default_sets: 4, default_reps: 10, default_weight: 80 },
        { name: "Romanian Deadlift", category: "legs", default_sets: 4, default_reps: 10, default_weight: 60 },
        { name: "Leg Press", category: "legs", default_sets: 4, default_reps: 12, default_weight: 120 },
        { name: "Plank", category: "core", default_sets: 3, default_reps: 60, default_weight: null },
        { name: "Crunch", category: "core", default_sets: 3, default_reps: 20, default_weight: null },
        { name: "Chạy bộ", category: "cardio", default_sets: 1, default_reps: 30, default_weight: null },
        { name: "Jump Rope", category: "cardio", default_sets: 5, default_reps: 60, default_weight: null },
        { name: "Deadlift", category: "back", default_sets: 4, default_reps: 6, default_weight: 100 },
    ];