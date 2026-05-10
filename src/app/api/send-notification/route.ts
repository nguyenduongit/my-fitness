import { NextRequest, NextResponse } from "next/server";
import webpush from "web-push";

/**
 * API Route: /api/send-notification
 *
 * Handles two actions:
 * 1. "subscribe" - Store a push subscription (in production, save to database)
 * 2. "send" - Send a push notification to a specific subscription
 *
 * Required environment variables:
 * - NEXT_PUBLIC_VAPID_PUBLIC_KEY
 * - VAPID_PRIVATE_KEY
 * - VAPID_SUBJECT (e.g., "mailto:your-email@example.com")
 */

// Configure VAPID credentials for web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || "";
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:admin@example.com";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubscribeRequestBody {
  action: "subscribe";
  subscription: webpush.PushSubscription;
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

type RequestBody = SubscribeRequestBody | SendRequestBody;

// ─── POST Handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body: RequestBody = await request.json();

    // ── Handle subscription registration ──
    if (body.action === "subscribe") {
      // In production, store `body.subscription` in your database
      // For this template, we just acknowledge the subscription
      console.log("📬 New push subscription registered:", JSON.stringify(body.subscription));

      return NextResponse.json(
        { success: true, message: "Subscription registered successfully." },
        { status: 201 }
      );
    }

    // ── Handle sending a notification ──
    if (body.action === "send") {
      if (!vapidPublicKey || !vapidPrivateKey) {
        return NextResponse.json(
          {
            success: false,
            message: "VAPID keys are not configured. Check your .env.local file.",
          },
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

    return NextResponse.json(
      { success: false, message: 'Invalid action. Use "subscribe" or "send".' },
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
