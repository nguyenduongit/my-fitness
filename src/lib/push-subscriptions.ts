import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PushSubscriptionRecord {
    id: string;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    created_at: string;
    updated_at: string;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/** Lấy tất cả push subscriptions của user */
export async function getUserPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
    const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*");

    if (error) throw error;
    return data ?? [];
}

/** Lấy tất cả push subscriptions (admin - dùng service role key) */
export async function getAllPushSubscriptions(): Promise<PushSubscriptionRecord[]> {
    const { data, error } = await supabase
        .from("push_subscriptions")
        .select("*");

    if (error) throw error;
    return data ?? [];
}

// ─── Mutations ───────────────────────────────────────────────────────────────

/** Lưu push subscription vào DB (upsert theo endpoint) */
export async function savePushSubscription(
    subscription: PushSubscription
): Promise<PushSubscriptionRecord> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const json = subscription.toJSON();
    const keys = json.keys as { p256dh: string; auth: string } | undefined;

    if (!json.endpoint || !keys?.p256dh || !keys?.auth) {
        throw new Error("Invalid push subscription");
    }

    const { data, error } = await supabase
        .from("push_subscriptions")
        .upsert(
            {
                user_id: user.id,
                endpoint: json.endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                updated_at: new Date().toISOString(),
            },
            { onConflict: "user_id,endpoint" }
        )
        .select()
        .single();

    if (error) throw error;
    return data;
}

/** Xoá push subscription */
export async function deletePushSubscription(endpoint: string): Promise<void> {
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Chưa đăng nhập");

    const { error } = await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", endpoint);

    if (error) throw error;
}
