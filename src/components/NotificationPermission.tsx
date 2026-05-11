"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, LoaderCircle } from "lucide-react";
import {
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/push.utils";
import { supabase } from "@/lib/supabase";

/**
 * NotificationPermission Component
 *
 * Displays the notification permission status and provides a button to
 * request notification permission and subscribe to push.
 */

export type PushPermissionState = "default" | "granted" | "denied" | "unsupported" | "loading";

interface NotificationPermissionProps {
  onPermissionChange?: (state: PushPermissionState) => void;
}

export default function NotificationPermission({
  onPermissionChange,
}: NotificationPermissionProps) {
  const [permissionState, setPermissionState] = useState<PushPermissionState>("loading");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>("");

  const updatePermissionState = useCallback((state: PushPermissionState) => {
    setPermissionState(state);
    onPermissionChange?.(state);
  }, [onPermissionChange]);

  // Check current notification permission on mount
  useEffect(() => {
    if (!isPushSupported()) {
      updatePermissionState("unsupported");
      return;
    }
    updatePermissionState(Notification.permission);

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
            // Re-save to backend
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await subscribeToPush(reg, user.id);
            }
          } else {
            // iOS Safari PWA: subscription may have been lost, re-subscribe silently
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
              await subscribeToPush(reg, user.id);
            }
          }
        }
      });
    }
  }, [updatePermissionState]);

  // Handle "Allow Notifications" button click
  const handleSubscribe = useCallback(async () => {
    setIsSubscribing(true);
    setStatusMessage("");

    try {
      // Step 1: Request permission
      const permission = await requestNotificationPermission();
      updatePermissionState(permission);

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

      // Step 3: Get user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setStatusMessage("Vui lòng đăng nhập trước khi bật thông báo.");
        return;
      }

      // Step 4: Subscribe to push (saves to Supabase)
      const sub = await subscribeToPush(registration, user.id);
      if (sub) {
        setStatusMessage("✅ Đã bật thông báo thành công!");
      } else {
        setStatusMessage("Không thể tạo push subscription.");
      }
    } catch (error) {
      setStatusMessage(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubscribing(false);
    }
  }, [updatePermissionState]);

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
          {permissionState === "loading" && "Đang kiểm tra..."}
          {permissionState === "unsupported" && "Trình duyệt không hỗ trợ thông báo đẩy"}
          {permissionState === "default" && "Chưa bật thông báo"}
          {permissionState === "granted" && "Đã bật thông báo"}
          {permissionState === "denied" && "Thông báo bị chặn"}
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
                  <LoaderCircle className="w-4 h-4 animate-spin" />
                  Đang kết nối...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Bật thông báo
                </>
              )}
            </span>
          </button>
        )}
      </div>

      {/* Status message */}
      {statusMessage && (
        <p
          className={`text-xs text-center px-4 py-2 rounded-lg ${statusMessage.startsWith("✅")
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
