import { supabase } from "./supabase";
import { FoodItem, FoodItemInsert } from "@/types/menu";

export async function getFoodItems(date: string): Promise<FoodItem[]> {
    const { data, error } = await supabase
        .from("food_items")
        .select("*")
        .eq("eaten_at", date)
        .order("created_at", { ascending: true });

    if (error) throw error;
    return data ?? [];
}

export async function addFoodItem(item: FoodItemInsert): Promise<FoodItem> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("food_items")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteFoodItem(id: string): Promise<void> {
    const { error } = await supabase.from("food_items").delete().eq("id", id);
    if (error) throw error;
}

export async function updateFoodItem(
    id: string,
    updates: Partial<FoodItemInsert>
): Promise<FoodItem> {
    const { data, error } = await supabase
        .from("food_items")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

    if (error) throw error;
    return data;
}