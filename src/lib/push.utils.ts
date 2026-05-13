/**
 * Push Notification Utilities
 *
 * Helper functions for registering service workers,
 * requesting notification permissions, and managing push subscriptions.
 * Subscriptions are saved to Supabase directly via the client library.
 */

import { savePushSubscription } from "./push-subscriptions";

/**
 * Check if the browser supports service workers and push notifications
 */
export function isPushSupported(): boolean {
  return "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
}

/**
 * Register the service worker
 * Returns the ServiceWorkerRegistration or null if not supported
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!("serviceWorker" in navigator)) {
    console.warn("Service workers are not supported in this browser.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register("/sw.js", {
      scope: "/",
    });
    console.log("✅ Service Worker registered with scope:", registration.scope);

    // Wait for the service worker to be active
    if (registration.installing || registration.waiting) {
      await new Promise<void>((resolve) => {
        const sw = registration.installing || registration.waiting;
        if (!sw) { resolve(); return; }
        
        if (sw.state === "activated") { resolve(); return; }

        sw.addEventListener("statechange", function handler() {
          if (sw.state === "activated") {
            sw.removeEventListener("statechange", handler);
            resolve();
          }
        });
      });
    }

    return registration;
  } catch (error) {
    console.error("❌ Service Worker registration failed:", error);
    return null;
  }
}

/**
 * Request notification permission from the user
 * Returns the permission state: 'granted', 'denied', or 'default'
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!("Notification" in window)) {
    console.warn("Notifications are not supported in this browser.");
    return "denied";
  }

  const permission = await Notification.requestPermission();
  console.log(`🔔 Notification permission: ${permission}`);
  return permission;
}

/**
 * Convert a base64 VAPID public key to a Uint8Array
 * Required by the PushManager.subscribe() method
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

/**
 * Subscribe to push notifications
 * Creates a push subscription and saves it directly to Supabase
 */
export async function subscribeToPush(
  registration: ServiceWorkerRegistration,
  userId: string
): Promise<PushSubscription | null> {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    console.error("❌ VAPID public key is not configured. Check your .env.local file.");
    return null;
  }

  try {
    // Check for existing subscription
    let existingSubscription: PushSubscription | null = null;
    try {
      existingSubscription = await registration.pushManager.getSubscription();
    } catch (err) {
      console.warn("⚠️ Failed to get existing subscription:", err);
    }

    if (existingSubscription) {
      const isExpired =
        existingSubscription.expirationTime !== null &&
        Date.now() > existingSubscription.expirationTime;

      if (isExpired) {
        console.log("⚠️ Subscription expired, unsubscribing and re-subscribing...");
        try {
          await existingSubscription.unsubscribe();
        } catch (err) {
          console.warn("⚠️ Failed to unsubscribe from expired subscription:", err);
        }
      } else {
        console.log("📬 Already subscribed to push notifications.");
        // Re-save to Supabase in case it was lost
        try {
          await savePushSubscription(existingSubscription);
        } catch (err) {
          console.warn("⚠️ Failed to re-save existing subscription:", err);
        }
        return existingSubscription;
      }
    }

    // Create a new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("✅ Push subscription created:", JSON.stringify(subscription));

    // Save subscription directly to Supabase
    try {
      await savePushSubscription(subscription);
      console.log("✅ Subscription saved to Supabase.");
    } catch (err) {
      console.warn("⚠️ Failed to save subscription to Supabase:", err);
      // Also try via API as fallback
      try {
        const apiResponse = await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "subscribe",
            subscription: subscription.toJSON(),
            user_id: userId,
          }),
        });
        if (!apiResponse.ok) {
          console.warn("⚠️ API fallback also failed:", apiResponse.status, apiResponse.statusText);
        } else {
          console.log("✅ Subscription saved via API fallback.");
        }
      } catch (apiErr) {
        console.error("❌ Both Supabase and API save methods failed:", apiErr);
      }
    }

    return subscription;
  } catch (error) {
    console.error("❌ Failed to subscribe to push notifications:", error);
    return null;
  }
}

/**
 * Send a test notification via the Supabase Edge Function
 */
export async function sendTestNotification(): Promise<boolean> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing Supabase configuration");
    }

    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        subscription: (await navigator.serviceWorker.ready.then(
          (reg) => reg.pushManager.getSubscription()
        ))?.toJSON(),
        payload: {
          title: "🎉 My Fitness",
          body: "Push notifications are working! You're all set.",
          icon: "/icons/icon-192x192.png",
          url: "/",
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Server responded with ${response.status}`);
    }

    console.log("✅ Test notification sent successfully.");
    return true;
  } catch (error) {
    console.error("❌ Failed to send test notification:", error);
    return false;
  }
}