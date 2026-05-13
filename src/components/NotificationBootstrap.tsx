"use client";

import { useEffect } from "react";
import {
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/push.utils";
import { savePushSubscription } from "@/lib/push-subscriptions";
import { supabase } from "@/lib/supabase";

let notificationBootstrapStarted = false;

async function subscribeCurrentUser(registration: ServiceWorkerRegistration | null) {
  if (!registration || Notification.permission !== "granted") return;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await subscribeToPush(registration, user.id);
  }
}

export default function NotificationBootstrap() {
  useEffect(() => {
    if (notificationBootstrapStarted || !isPushSupported()) return;
    notificationBootstrapStarted = true;

    let registration: ServiceWorkerRegistration | null = null;
    let subscriptionCheckInterval: NodeJS.Timeout | null = null;

    const initializeNotifications = async () => {
      registration = await registerServiceWorker();

      // Only subscribe if permission is already granted
      // Don't auto-request permission - let user click the button
      if (Notification.permission === "granted") {
        await subscribeCurrentUser(registration);
      }

      // For iOS PWA: periodically check if subscription is still valid
      // iOS Safari PWA frequently revokes subscriptions
      if (subscriptionCheckInterval) clearInterval(subscriptionCheckInterval);
      subscriptionCheckInterval = setInterval(async () => {
        if (registration && Notification.permission === "granted") {
          const existingSub = await registration.pushManager.getSubscription();
          if (!existingSub) {
            console.log("⚠️ [iOS PWA] Subscription lost, attempting to re-subscribe...");
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await subscribeCurrentUser(registration);
            }
          }
        }
      }, 60000); // Check every minute
    };

    initializeNotifications().catch((error) => {
      console.error("Failed to initialize notifications:", error);
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      subscribeCurrentUser(registration).catch((error) => {
        console.error("Failed to subscribe current user to notifications:", error);
      });
    });

    // Listen for push subscription changes from the service worker
    // (e.g., when iOS Safari revokes the subscription)
    const handleSWMessage = async (event: MessageEvent) => {
      if (event.data?.type === "PUSH_SUBSCRIPTION_CHANGED" && event.data?.subscription) {
        console.log("🔄 Handling push subscription change from SW...");
        try {
          // Reconstruct PushSubscription-like object for saving
          const subData = event.data.subscription;
          if (subData.endpoint && subData.keys?.p256dh && subData.keys?.auth) {
            const {
              data: { user },
            } = await supabase.auth.getUser();

            if (user) {
              // Save directly to Supabase
              const { error } = await supabase.from("push_subscriptions").upsert(
                {
                  user_id: user.id,
                  endpoint: subData.endpoint,
                  p256dh: subData.keys.p256dh,
                  auth: subData.keys.auth,
                  updated_at: new Date().toISOString(),
                },
                { onConflict: "user_id,endpoint" }
              );
              if (error) {
                console.error("❌ Failed to update subscription:", error);
              } else {
                console.log("✅ Updated push subscription after change.");
              }
            }
          }
        } catch (err) {
          console.error("Failed to handle push subscription change:", err);
        }
      }
    };

    navigator.serviceWorker?.addEventListener("message", handleSWMessage);

    return () => {
      subscription.unsubscribe();
      navigator.serviceWorker?.removeEventListener("message", handleSWMessage);
      if (subscriptionCheckInterval) clearInterval(subscriptionCheckInterval);
    };
  }, []);

  return null;
}
