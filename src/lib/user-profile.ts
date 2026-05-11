import { supabase } from "./supabase";
import {
    UserProfile,
    UserProfileUpsert,
    DEFAULT_USER_PROFILE,
} from "@/types/user-profile";

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Lấy profile của user (trả về default nếu chưa có) */
export async function getUserProfile(): Promise<UserProfileUpsert> {
    const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .maybeSingle();

    if (error) throw error;

    if (!data) {
        return { ...DEFAULT_USER_PROFILE };
    }

    return {
        age: data.age,
        gender: data.gender,
        height_cm: data.height_cm,
        weight_kg: data.weight_kg,
        chest_cm: data.chest_cm,
        waist_cm: data.waist_cm,
        hip_cm: data.hip_cm,
        bicep_cm: data.bicep_cm,
        thigh_cm: data.thigh_cm,
    };
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Lưu hoặc cập nhật profile (upsert) */
export async function saveUserProfile(
    profile: UserProfileUpsert
): Promise<UserProfile> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { data, error } = await supabase
        .from("user_profiles")
        .upsert(
            {
                user_id: user.id,
                ...profile,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}
