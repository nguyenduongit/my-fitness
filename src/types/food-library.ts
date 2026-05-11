export interface FoodLibraryItem {
    id: string;
    user_id: string;
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    thumbnail_base64: string | null;
    unit: string;
    quantity: number;
    calcium: number;
    magnesium: number;
    zinc: number;
    iron: number;
    vitamin_a: number;
    vitamin_c: number;
    vitamin_d: number;
    created_at: string;
    updated_at: string;
}

export type FoodLibraryItemInsert = Omit<
    FoodLibraryItem,
    "id" | "user_id" | "created_at" | "updated_at"
>;
