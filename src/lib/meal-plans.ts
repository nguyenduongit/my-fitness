import { supabase } from "./supabase";
import { MealPlanItem, MealPlanItemInsert } from "@/types/meal-plan";
import { DayOfWeek } from "@/types/schedule";
import { MealType } from "@/types/meal-plan";

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Lấy toàn bộ thực đơn của user */
export async function getAllMealPlanItems(): Promise<MealPlanItem[]> {
    const { data, error } = await supabase
        .from("meal_plan_items")
        .select("*")
        .order("day_of_week", { ascending: true })
        .order("order_index", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

/** Lấy thực đơn theo ngày trong tuần */
export async function getMealPlanByDay(
    dayOfWeek: DayOfWeek
): Promise<MealPlanItem[]> {
    const { data, error } = await supabase
        .from("meal_plan_items")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .order("order_index", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

/** Lấy thực đơn theo ngày + loại bữa */
export async function getMealPlanByDayAndMeal(
    dayOfWeek: DayOfWeek,
    mealType: MealType
): Promise<MealPlanItem[]> {
    const { data, error } = await supabase
        .from("meal_plan_items")
        .select("*")
        .eq("day_of_week", dayOfWeek)
        .eq("meal_type", mealType)
        .order("order_index", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Thêm món ăn vào thực đơn */
export async function addMealPlanItem(
    item: MealPlanItemInsert
): Promise<MealPlanItem> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("meal_plan_items")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Cập nhật món ăn trong thực đơn */
export async function updateMealPlanItem(
    id: string,
    updates: Partial<MealPlanItemInsert>
): Promise<MealPlanItem> {
    const { data, error } = await supabase
        .from("meal_plan_items")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Xoá món ăn khỏi thực đơn */
export async function deleteMealPlanItem(id: string): Promise<void> {
    const { error } = await supabase
        .from("meal_plan_items")
        .delete()
        .eq("id", id);

    if (error) throw error;
}

/** Xoá toàn bộ thực đơn của 1 bữa trong ngày */
export async function clearMealPlan(
    dayOfWeek: DayOfWeek,
    mealType: MealType
): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { error } = await supabase
        .from("meal_plan_items")
        .delete()
        .eq("user_id", user.id)
        .eq("day_of_week", dayOfWeek)
        .eq("meal_type", mealType);

    if (error) throw error;
}
