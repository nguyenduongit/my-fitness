/// <reference lib="webworker" />

/**
 * Service Worker for My Fitness PWA
 *
 * Handles:
 * 1. Caching of static assets for offline support
 * 2. Push notification events (works even when app is closed!)
 * 3. Notification click handling
 * 4. Background sync for failed notifications
 */

const CACHE_NAME = "my-fitness-v3";

// Assets to pre-cache on install
const PRECACHE_ASSETS = ["/", "/icons/icon-192x192.png", "/icons/icon-512x512.png"];

// ─── Install Event ───────────────────────────────────────────────────────────
// Pre-cache essential assets when the service worker is installed
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate Event ──────────────────────────────────────────────────────────
// Clean up old caches and claim all clients immediately
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => caches.delete(name))
        )
      )
      .then(() => self.clients.claim())
  );
});

// ─── Fetch Event ─────────────────────────────────────────────────────────────
// Network-first strategy: try network, fall back to cache
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests and chrome-extension requests
  if (event.request.method !== "GET") return;
  if (event.request.url.startsWith("chrome-extension://")) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone the response before caching (response can only be consumed once)
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});

// ─── Push Event ──────────────────────────────────────────────────────────────
// Handle incoming push notifications from the server
// ⭐ THIS WORKS EVEN WHEN THE APP IS CLOSED — the Service Worker runs independently
self.addEventListener("push", (event) => {
  /** @type {{ title: string; body: string; icon?: string; badge?: string; url?: string; tag?: string }} */
  let data = {
    title: "My Fitness",
    body: "You have a new notification!",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    url: "/",
    tag: "myfitness-general",
  };

  // Parse the push data if available
  if (event.data) {
    try {
      const payload = event.data.json();
      data = { ...data, ...payload };
    } catch {
      data.body = event.data.text();
    }
  }

  // Generate a unique tag to prevent notification stacking for the same type
  const tag = data.tag || `myfitness-${Date.now()}`;

  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192x192.png",
    badge: data.badge || "/icons/icon-192x192.png",
    vibrate: [200, 100, 200, 100, 200],
    tag: tag,
    renotify: true, // Vibrate even if same tag
    requireInteraction: false, // Auto-dismiss after a while on desktop
    data: { url: data.url || "/" },
    actions: [
      { action: "open", title: "Mở ứng dụng" },
      { action: "close", title: "Đóng" },
    ],
    // iOS Safari PWA doesn't support actions, but the notification itself works
    silent: false,
  };

  // ⭐ event.waitUntil ensures the SW stays alive until the notification is shown
  event.waitUntil(self.registration.showNotification(data.title, options));
});

// ─── Notification Click Event ────────────────────────────────────────────────
// Handle when user clicks on a notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  // Open the app or focus an existing window
  const targetUrl = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // If there's already an open window, focus it and navigate
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Otherwise, open a new window
      return self.clients.openWindow(targetUrl);
    })
  );
});

// ─── Push Subscription Change Event ──────────────────────────────────────────
// Handle when the push subscription is revoked or expires (e.g., iOS Safari)
self.addEventListener("pushsubscriptionchange", (event) => {
  console.log("🔄 Push subscription changed, re-subscribing...");

  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription?.options || { userVisibleOnly: true })
      .then((newSubscription) => {
        // Notify the app to save the new subscription
        return self.clients.matchAll().then((clients) => {
          for (const client of clients) {
            client.postMessage({
              type: "PUSH_SUBSCRIPTION_CHANGED",
              subscription: newSubscription.toJSON(),
            });
          }
        });
      })
      .catch((err) => {
        console.error("❌ Failed to re-subscribe:", err);
      })
  );
});
