"use client";

import { useEffect } from "react";
import {
  isPushSupported,
  registerServiceWorker,
  requestNotificationPermission,
  subscribeToPush,
} from "@/lib/push.utils";
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

    const initializeNotifications = async () => {
      registration = await registerServiceWorker();

      if (Notification.permission === "default") {
        await requestNotificationPermission();
      }

      await subscribeCurrentUser(registration);
    };

    initializeNotifications().catch((error) => {
      console.error("Failed to initialize notifications:", error);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      subscribeCurrentUser(registration).catch((error) => {
        console.error("Failed to subscribe current user to notifications:", error);
      });
    });

    return () => subscription.unsubscribe();
  }, []);

  return null;
}
