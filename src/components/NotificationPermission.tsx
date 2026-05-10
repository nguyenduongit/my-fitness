"use client";

import { useState, useEffect, useCallback } from "react";
import {
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
  sendTestNotification,
} from "@/lib/push.utils";

/**
 * NotificationPermission Component
 *
 * Displays the notification permission status and provides buttons to:
 * 1. Request notification permission and subscribe to push
 * 2. Send a test notification to verify the setup
 */

type PermissionState = "default" | "granted" | "denied" | "unsupported" | "loading";

export default function NotificationPermission() {
  const [permissionState, setPermissionState] = useState<PermissionState>("loading");
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  // Check current notification permission on mount
  useEffect(() => {
    if (!isPushSupported()) {
      setPermissionState("unsupported");
      return;
    }
    setPermissionState(Notification.permission);

    // If already granted, register service worker and get/create subscription
    if (Notification.permission === "granted") {
      registerServiceWorker().then(async (reg) => {
        if (reg) {
          // Wait for service worker to be active before accessing pushManager
          if (reg.installing || reg.waiting) {
            await new Promise<void>((resolve) => {
              const sw = reg.installing || reg.waiting;
              sw?.addEventListener("statechange", function handler() {
                if (reg.active) {
                  sw.removeEventListener("statechange", handler);
                  resolve();
                }
              });
            });
          }
          const existingSub = await reg.pushManager.getSubscription();
          if (existingSub) {
            setSubscription(existingSub);
          } else {
            // iOS Safari PWA: subscription may have been lost, re-subscribe silently
            const newSub = await subscribeToPush(reg);
            if (newSub) setSubscription(newSub);
          }
        }
      });
    }
  }, []);

  // Handle "Allow Notifications" button click
  const handleSubscribe = useCallback(async () => {
    setIsSubscribing(true);
    setStatusMessage("");

    try {
      // Step 1: Request permission
      const permission = await requestNotificationPermission();
      setPermissionState(permission);

      if (permission !== "granted") {
        setStatusMessage("Permission denied. Please enable notifications in your browser settings.");
        return;
      }

      // Step 2: Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        setStatusMessage("Failed to register service worker.");
        return;
      }

      // Step 3: Subscribe to push
      const sub = await subscribeToPush(registration);
      if (sub) {
        setSubscription(sub);
        setStatusMessage("✅ Successfully subscribed to notifications!");
      } else {
        setStatusMessage("Failed to create push subscription. Check VAPID key configuration.");
      }
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubscribing(false);
    }
  }, []);

  // Handle "Test Notification" button click
  const handleTestNotification = useCallback(async () => {
    if (!subscription) {
      setStatusMessage("Please subscribe to notifications first.");
      return;
    }

    setIsSending(true);
    setStatusMessage("");

    try {
      const success = await sendTestNotification(subscription);
      if (success) {
        setStatusMessage("🔔 Test notification sent! Check your notification center.");
      } else {
        setStatusMessage("Failed to send test notification. Check your VAPID key configuration.");
      }
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSending(false);
    }
  }, [subscription]);

  // ── Render ──

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-sm">
      {/* Status indicator */}
      <div className="flex items-center gap-2 text-sm">
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full ${permissionState === "granted"
              ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]"
              : permissionState === "denied"
                ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.6)]"
                : "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]"
            }`}
        />
        <span className="text-white/60">
          {permissionState === "loading" && "Checking notification support..."}
          {permissionState === "unsupported" && "Push notifications are not supported"}
          {permissionState === "default" && "Notifications not yet enabled"}
          {permissionState === "granted" && "Notifications enabled"}
          {permissionState === "denied" && "Notifications blocked"}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 w-full">
        {/* Subscribe button */}
        {permissionState !== "granted" && permissionState !== "unsupported" && (
          <button
            onClick={handleSubscribe}
            disabled={isSubscribing || permissionState === "loading"}
            className="flex-1 relative group px-6 py-3 min-h-[44px] rounded-xl font-medium text-sm
              bg-gradient-to-r from-indigo-500 to-cyan-500
              hover:from-indigo-400 hover:to-cyan-400
              active:from-indigo-600 active:to-cyan-600
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white shadow-lg shadow-indigo-500/25
              transition-all duration-300
              hover:shadow-xl hover:shadow-indigo-500/30
              hover:-translate-y-0.5
              active:scale-[0.98] active:shadow-md"
            id="btn-allow-notifications"
          >
            <span className="relative z-10 flex items-center justify-center gap-2">
              {isSubscribing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Subscribing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  Allow Notifications
                </>
              )}
            </span>
          </button>
        )}

        {/* Test notification button */}
        {permissionState === "granted" && (
          <button
            onClick={handleTestNotification}
            disabled={isSending || !subscription}
            className="flex-1 px-6 py-3 min-h-[44px] rounded-xl font-medium text-sm
              bg-white/5 border border-white/10
              hover:bg-white/10 hover:border-white/20
              active:bg-white/15 active:border-white/25
              disabled:opacity-50 disabled:cursor-not-allowed
              text-white/90 backdrop-blur-sm
              transition-all duration-300
              hover:-translate-y-0.5
              active:scale-[0.98]"
            id="btn-test-notification"
          >
            <span className="flex items-center justify-center gap-2">
              {isSending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Sending...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                    />
                  </svg>
                  Test Notification
                </>
              )}
            </span>
          </button>
        )}
      </div>

      {/* Status message */}
      {statusMessage && (
        <p
          className={`text-xs text-center px-4 py-2 rounded-lg ${statusMessage.startsWith("✅") || statusMessage.startsWith("🔔")
              ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
              : "bg-red-500/10 text-red-300 border border-red-500/20"
            }`}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}