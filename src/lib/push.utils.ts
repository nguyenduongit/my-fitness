/**
 * Push Notification Utilities
 *
 * Helper functions for registering service workers,
 * requesting notification permissions, and managing push subscriptions.
 * Subscriptions are saved to Supabase via API.
 */

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
 * Sends the subscription to the server API endpoint and saves to Supabase
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
    const existingSubscription = await registration.pushManager.getSubscription();
    if (existingSubscription) {
      const isExpired =
        existingSubscription.expirationTime !== null &&
        Date.now() > existingSubscription.expirationTime;

      if (isExpired) {
        console.log("⚠️ Subscription expired, unsubscribing and re-subscribing...");
        await existingSubscription.unsubscribe();
      } else {
        console.log("📬 Already subscribed to push notifications.");
        // Re-save to backend in case it was lost
        await fetch("/api/send-notification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "subscribe",
            subscription: existingSubscription.toJSON(),
            user_id: userId,
          }),
        });
        return existingSubscription;
      }
    }

    // Create a new subscription
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    console.log("✅ Push subscription created:", JSON.stringify(subscription));

    // Send subscription to backend (saves to Supabase)
    await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "subscribe",
        subscription: subscription.toJSON(),
        user_id: userId,
      }),
    });

    return subscription;
  } catch (error) {
    console.error("❌ Failed to subscribe to push notifications:", error);
    return null;
  }
}

/**
 * Send a test notification via the API endpoint
 */
export async function sendTestNotification(
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const response = await fetch("/api/send-notification", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        subscription: subscription.toJSON(),
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