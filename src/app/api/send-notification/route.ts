import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

/**
 * API Route: /api/send-notification
 *
 * Handles:
 * 1. "subscribe" - Lưu push subscription vào Supabase
 * 2. "send" - Gửi push notification đến 1 subscription
 * 3. "send-to-user" - Gửi push notification đến tất cả devices của 1 user
 */

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// Server-side Supabase client (bypass RLS for admin operations)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubscribeRequestBody {
    action: "subscribe";
    subscription: webpush.PushSubscription;
    user_id: string;
}

interface SendRequestBody {
    action: "send";
    subscription: webpush.PushSubscription;
    payload: {
        title: string;
        body: string;
        icon?: string;
        url?: string;
    };
}

interface SendToUserRequestBody {
    action: "send-to-user";
    user_id: string;
    payload: {
        title: string;
        body: string;
        icon?: string;
        url?: string;
    };
}

type RequestBody = SubscribeRequestBody | SendRequestBody | SendToUserRequestBody;

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
    try {
        const body: RequestBody = await request.json();

        // ── Handle subscription registration ──
        if (body.action === "subscribe") {
            const { subscription, user_id } = body;
            const subJson = typeof subscription === "object" ? subscription : JSON.parse(JSON.stringify(subscription));
            const keys = subJson.keys as { p256dh?: string; auth?: string } | undefined;

            if (!subJson.endpoint || !keys?.p256dh || !keys?.auth) {
                return NextResponse.json(
                    { success: false, message: "Invalid subscription data." },
                    { status: 400 }
                );
            }

            // Lưu vào Supabase
            const { error } = await supabaseAdmin
                .from("push_subscriptions")
                .upsert(
                    {
                        user_id,
                        endpoint: subJson.endpoint,
                        p256dh: keys.p256dh,
                        auth: keys.auth,
                        updated_at: new Date().toISOString(),
                    },
                    { onConflict: "user_id,endpoint" }
                );

            if (error) {
                console.error("❌ Failed to save subscription:", error);
                return NextResponse.json(
                    { success: false, message: "Failed to save subscription." },
                    { status: 500 }
                );
            }

            console.log("📬 Push subscription saved for user:", user_id);
            return NextResponse.json(
                { success: true, message: "Subscription registered successfully." },
                { status: 201 }
            );
        }

        // ── Handle sending a notification ──
        if (body.action === "send") {
            if (!vapidPublicKey || !vapidPrivateKey) {
                return NextResponse.json(
                    { success: false, message: "VAPID keys are not configured." },
                    { status: 500 }
                );
            }

            const { subscription, payload } = body;
            await webpush.sendNotification(subscription, JSON.stringify(payload));

            return NextResponse.json(
                { success: true, message: "Notification sent successfully." },
                { status: 200 }
            );
        }

        // ── Handle sending notification to all devices of a user ──
        if (body.action === "send-to-user") {
            if (!vapidPublicKey || !vapidPrivateKey) {
                return NextResponse.json(
                    { success: false, message: "VAPID keys are not configured." },
                    { status: 500 }
                );
            }

            const { user_id, payload } = body;

            // Lấy tất cả subscriptions của user
            const { data: subs, error } = await supabaseAdmin
                .from("push_subscriptions")
                .select("*")
                .eq("user_id", user_id);

            if (error) throw error;

            if (!subs || subs.length === 0) {
                return NextResponse.json(
                    { success: false, message: "No subscriptions found for user." },
                    { status: 404 }
                );
            }

            // Gửi đến tất cả devices
            const results = await Promise.allSettled(
                subs.map((sub) =>
                    webpush.sendNotification(
                        {
                            endpoint: sub.endpoint,
                            keys: { p256dh: sub.p256dh, auth: sub.auth },
                        },
                        JSON.stringify(payload)
                    )
                )
            );

            // Xoá subscriptions hết hạn (status 410)
            const expiredEndpoints = results
                .map((r, i) => {
                    if (r.status === "rejected" && (r.reason as { statusCode?: number })?.statusCode === 410) {
                        return subs[i].endpoint;
                    }
                    return null;
                })
                .filter(Boolean);

            if (expiredEndpoints.length > 0) {
                await supabaseAdmin
                    .from("push_subscriptions")
                    .delete()
                    .eq("user_id", user_id)
                    .in("endpoint", expiredEndpoints as string[]);
            }

            const sent = results.filter((r) => r.status === "fulfilled").length;
            return NextResponse.json(
                { success: true, message: `Sent to ${sent}/${subs.length} devices.` },
                { status: 200 }
            );
        }

        return NextResponse.json(
            { success: false, message: 'Invalid action.' },
            { status: 400 }
        );
    } catch (error) {
        console.error("❌ Push notification error:", error);
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : "Internal server error.",
            },
            { status: 500 }
        );
    }
}
