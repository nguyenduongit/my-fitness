// ─── Meal Plan Types ─────────────────────────────────────────────────────────
// Thực đơn cố định theo thứ trong tuần (không thay đổi theo tuần)

import { DayOfWeek } from "./schedule";

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MealPlanItem {
    id: string;
    user_id: string;
    day_of_week: DayOfWeek;
    meal_type: MealType;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    quantity: number;
    unit: string;
    order_index: number;
    created_at: string;
    updated_at: string;
}

export type MealPlanItemInsert = Omit<
    MealPlanItem,
    "id" | "user_id" | "created_at" | "updated_at"
>;

export interface DailyGoal {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
}

export const DEFAULT_DAILY_GOAL: DailyGoal = {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fat: 65,
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const MEAL_TYPES: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

export const MEAL_LABELS: Record<MealType, string> = {
    breakfast: "Bữa sáng",
    lunch: "Bữa trưa",
    dinner: "Bữa tối",
    snack: "Bữa phụ",
};

export const MEAL_ICONS: Record<MealType, string> = {
    breakfast: "🌅",
    lunch: "☀️",
    dinner: "🌙",
    snack: "🍎",
};

export const MEAL_COLORS: Record<MealType, string> = {
    breakfast: "from-amber-500/20 to-orange-500/10",
    lunch: "from-cyan-500/20 to-blue-500/10",
    dinner: "from-purple-500/20 to-indigo-500/10",
    snack: "from-emerald-500/20 to-teal-500/10",
};

// Gợi ý món ăn phổ biến Việt Nam
export const FOOD_SUGGESTIONS = [
    { name: "Cơm trắng", calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: "g", quantity: 100 },
    { name: "Phở bò", calories: 350, protein: 25, carbs: 45, fat: 8, unit: "tô", quantity: 1 },
    { name: "Bánh mì thịt", calories: 400, protein: 20, carbs: 50, fat: 12, unit: "cái", quantity: 1 },
    { name: "Bún bò Huế", calories: 380, protein: 22, carbs: 50, fat: 10, unit: "tô", quantity: 1 },
    { name: "Gà luộc", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "g", quantity: 100 },
    { name: "Trứng chiên", calories: 90, protein: 6, carbs: 0, fat: 7, unit: "quả", quantity: 1 },
    { name: "Yến mạch", calories: 150, protein: 5, carbs: 27, fat: 3, unit: "g", quantity: 40 },
    { name: "Chuối", calories: 90, protein: 1.1, carbs: 23, fat: 0.3, unit: "quả", quantity: 1 },
    { name: "Sữa chua", calories: 100, protein: 5, carbs: 13, fat: 2, unit: "hộp", quantity: 1 },
    { name: "Ức gà nướng", calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: "g", quantity: 100 },
];
