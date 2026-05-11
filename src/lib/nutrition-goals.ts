import { supabase } from "./supabase";
import {
    NutritionGoal,
    NutritionGoalUpsert,
    DEFAULT_NUTRITION_GOAL,
} from "@/types/nutrition-goal";

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Lấy mục tiêu dinh dưỡng của user (trả về default nếu chưa có) */
export async function getNutritionGoal(): Promise<NutritionGoalUpsert> {
    const { data, error } = await supabase
        .from("nutrition_goals")
        .select("*")
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        return { ...DEFAULT_NUTRITION_GOAL };
    }

    return {
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        water_ml: data.water_ml,
    };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Lưu hoặc cập nhật mục tiêu dinh dưỡng (upsert) */
export async function saveNutritionGoal(
    goal: NutritionGoalUpsert
): Promise<NutritionGoal> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("nutrition_goals")
        .upsert(
            {
                user_id: user.id,
                ...goal,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}
