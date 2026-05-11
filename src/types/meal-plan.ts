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
    { name: "Ức gà sống", calories: 120, protein: 22.5, carbs: 0, fat: 2.6, unit: "g", quantity: 100 },
    { name: "Thịt bò thăn", calories: 250, protein: 26, carbs: 0, fat: 15, unit: "g", quantity: 100 },
    { name: "Trứng gà", calories: 72, protein: 6, carbs: 0.4, fat: 5, unit: "quả", quantity: 1 },
    { name: "Sữa tươi không đường", calories: 62, protein: 3, carbs: 4.8, fat: 3.3, unit: "ml", quantity: 100 },
    { name: "Yến mạch", calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9, unit: "g", quantity: 100 },
    { name: "Khoai lang luộc", calories: 86, protein: 1.6, carbs: 20, fat: 0.1, unit: "g", quantity: 100 },
    { name: "Chuối", calories: 89, protein: 1.1, carbs: 22.8, fat: 0.3, unit: "g", quantity: 100 },
    { name: "Sữa chua Hy Lạp", calories: 59, protein: 10, carbs: 3.6, fat: 0.4, unit: "g", quantity: 100 },
    { name: "Bơ đậu phộng", calories: 588, protein: 25, carbs: 20, fat: 50, unit: "g", quantity: 100 },
    { name: "Dầu ô liu", calories: 884, protein: 0, carbs: 0, fat: 100, unit: "ml", quantity: 100 },
    { name: "Bông cải xanh", calories: 34, protein: 2.8, carbs: 6.6, fat: 0.4, unit: "g", quantity: 100 },
    { name: "Cá hồi", calories: 208, protein: 20, carbs: 0, fat: 13, unit: "g", quantity: 100 },
    { name: "Hạnh nhân", calories: 579, protein: 21, carbs: 22, fat: 50, unit: "g", quantity: 100 },
];
