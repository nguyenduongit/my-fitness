import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";
import { createClient } from "@supabase/supabase-js";

/**
 * API Route: /api/cron/send-reminders
 *
 * Endpoint được gọi bởi cron job (VD: Vercel Cron, Supabase Edge Functions)
 * Kiểm tra giờ hiện tại so với notification_settings của từng user,
 * và gửi push notification nhắc nhở phù hợp.
 *
 * Cần header: Authorization: Bearer <CRON_SECRET>
 */

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// ─── Notification templates ──────────────────────────────────────────────────

const NOTIFICATION_TEMPLATES: Record<string, { title: string; body: string; icon: string }> = {
    breakfast_time: {
        title: "🌅 Đến giờ ăn sáng!",
        body: "Bắt đầu ngày mới với bữa sáng đầy năng lượng nhé!",
        icon: "/icons/icon-192x192.png",
    },
    lunch_time: {
        title: "☀️ Đến giờ ăn trưa!",
        body: "Nạp năng lượng cho buổi chiều. Ăn đúng bữa nhé!",
        icon: "/icons/icon-192x192.png",
    },
    dinner_time: {
        title: "🌙 Đến giờ ăn tối!",
        body: "Bữa tối nhẹ nhàng giúp bạn nghỉ ngơi tốt hơn.",
        icon: "/icons/icon-192x192.png",
    },
    snack_time: {
        title: "🍎 Giờ ăn phụ!",
        body: "Một bữa nhẹ giúp duy trì năng lượng suốt cả ngày.",
        icon: "/icons/icon-192x192.png",
    },
    workout_time: {
        title: "🏋️ Đến giờ tập luyện!",
        body: "Hãy vận động để khoẻ mạnh hơn mỗi ngày!",
        icon: "/icons/icon-192x192.png",
    },
    water_reminder: {
        title: "💧 Nhắc uống nước!",
        body: "Đừng quên uống nước đều đặn để giữ cơ thể khoẻ mạnh.",
        icon: "/icons/icon-192x192.png",
    },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentTimeHHMM(offsetHours: number = 7): string {
    const now = new Date();
    const utc = now.getTime() + now.getTimezoneOffset() * 60000;
    const local = new Date(utc + offsetHours * 3600000);
    const hh = String(local.getHours()).padStart(2, "0");
    const mm = String(local.getMinutes()).padStart(2, "0");
    return `${hh}:${mm}`;
}

async function sendToUser(userId: string, payload: { title: string; body: string; icon: string; url?: string }) {
    const { data: subs } = await supabaseAdmin
        .from("push_subscriptions")
        .select("*")
        .eq("user_id", userId);

    if (!subs || subs.length === 0) return 0;

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

    // Cleanup expired
    const expired = results
        .map((r, i) => (r.status === "rejected" && (r.reason as { statusCode?: number })?.statusCode === 410 ? subs[i].endpoint : null))
        .filter(Boolean);

    if (expired.length > 0) {
        await supabaseAdmin
            .from("push_subscriptions")
            .delete()
            .eq("user_id", userId)
            .in("endpoint", expired as string[]);
    }

    return results.filter((r) => r.status === "fulfilled").length;
}

// ─── GET Handler (for Vercel Cron) ───────────────────────────────────────────

export async function GET(request: NextRequest) {
    try {
        // Optional: verify cron secret
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret) {
            const authHeader = request.headers.get("authorization");
            if (authHeader !== `Bearer ${cronSecret}`) {
                return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
            }
        }

        const currentTime = getCurrentTimeHHMM(7); // UTC+7
        console.log(`⏰ Cron running at ${currentTime}`);

        // 1. Kiểm tra notification_settings - giờ ăn/tập
        const timeFields = ["breakfast_time", "lunch_time", "dinner_time", "snack_time", "workout_time"];

        for (const field of timeFields) {
            const { data: matchingUsers } = await supabaseAdmin
                .from("notification_settings")
                .select("user_id")
                .eq(field, currentTime);

            if (matchingUsers && matchingUsers.length > 0) {
                const template = NOTIFICATION_TEMPLATES[field];
                for (const row of matchingUsers) {
                    await sendToUser(row.user_id, { ...template, url: "/" });
                }
                console.log(`📤 Sent ${field} notifications to ${matchingUsers.length} users`);
            }
        }

        // 2. Kiểm tra water_schedules - giờ uống nước
        const { data: waterMatches } = await supabaseAdmin
            .from("water_schedules")
            .select("user_id")
            .eq("time", currentTime);

        if (waterMatches && waterMatches.length > 0) {
            const uniqueUsers = [...new Set(waterMatches.map((w) => w.user_id))];
            const template = NOTIFICATION_TEMPLATES.water_reminder;
            for (const userId of uniqueUsers) {
                await sendToUser(userId, { ...template, url: "/" });
            }
            console.log(`💧 Sent water reminders to ${uniqueUsers.length} users`);
        }

        return NextResponse.json({
            success: true,
            time: currentTime,
            message: "Reminders processed.",
        });
    } catch (error) {
        console.error("❌ Cron error:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
}
