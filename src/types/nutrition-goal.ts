// ─── Nutrition Goal Types ─────────────────────────────────────────────────────
// Mục tiêu dinh dưỡng hàng ngày

export interface NutritionGoal {
    id: string;
    user_id: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
    water_ml: number;
    created_at: string;
    updated_at: string;
}

export type NutritionGoalUpsert = Omit<
    NutritionGoal,
    "id" | "user_id" | "created_at" | "updated_at"
>;

// ─── Defaults ────────────────────────────────────────────────────────────────

export const DEFAULT_NUTRITION_GOAL: NutritionGoalUpsert = {
    calories: 2000,
    protein_g: 150,
    carbs_g: 200,
    fat_g: 65,
    water_ml: 2000,
};

// ─── Labels ──────────────────────────────────────────────────────────────────

export const NUTRITION_LABELS: Record<string, string> = {
    calories: "Calo",
    protein_g: "Protein",
    carbs_g: "Carb",
    fat_g: "Chất béo",
    water_ml: "Nước",
};

export const NUTRITION_UNITS: Record<string, string> = {
    calories: "kcal",
    protein_g: "g",
    carbs_g: "g",
    fat_g: "g",
    water_ml: "ml",
};

export const NUTRITION_ICONS: Record<string, string> = {
    calories: "🔥",
    protein_g: "🥩",
    carbs_g: "🍚",
    fat_g: "🥑",
    water_ml: "💧",
};

export const NUTRITION_COLORS: Record<string, string> = {
    calories: "#f59e0b",
    protein_g: "#818cf8",
    carbs_g: "#22d3ee",
    fat_g: "#fb923c",
    water_ml: "#38bdf8",
};

export type NutritionFieldKey = keyof NutritionGoalUpsert;

export const NUTRITION_FIELDS: NutritionFieldKey[] = [
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "water_ml",
];
