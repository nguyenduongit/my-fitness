import { supabase } from "./supabase";
import { FoodLibraryItem, FoodLibraryItemInsert } from "@/types/food-library";

// Lấy danh sách thực phẩm của user
export async function getFoodLibrary(): Promise<FoodLibraryItem[]> {
    const { data, error } = await supabase
        .from("food_library")
        .select("*")
        .order("name");
    if (error) throw error;
    return data ?? [];
}

// Thêm thực phẩm mới
export async function addFoodLibraryItem(
    item: FoodLibraryItemInsert
): Promise<FoodLibraryItem> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");
    const { data, error } = await supabase
        .from("food_library")
        .insert({ ...item, user_id: user.id })
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Cập nhật thực phẩm
export async function updateFoodLibraryItem(
    id: string,
    updates: Partial<FoodLibraryItemInsert>
): Promise<FoodLibraryItem> {
    const { data, error } = await supabase
        .from("food_library")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select()
        .single();
    if (error) throw error;
    return data;
}

// Xóa thực phẩm
export async function deleteFoodLibraryItem(id: string): Promise<void> {
    const { error } = await supabase
        .from("food_library")
        .delete()
        .eq("id", id);
    if (error) throw error;
}