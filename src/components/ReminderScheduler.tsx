"use client";

import { useCallback, useEffect, useRef } from "react";
import { getNotificationSettings } from "@/lib/notification-settings";
import {
    getCurrentReminderTime,
    getReminderDateKey,
    REMINDER_TEMPLATES,
    ReminderKind,
} from "@/lib/reminder-notifications";
import { supabase } from "@/lib/supabase";
import { getWaterSchedules } from "@/lib/water";
import { TIME_FIELDS } from "@/types/notification-settings";

type ReminderEntry = {
    kind: ReminderKind;
    time: string;
    dedupeId: string;
};

const REMINDER_EVENT = "myfitness:reminders-updated";
const CHECK_INTERVAL_MS = 15_000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getMsUntilTime(time: string) {
    const [hours, minutes] = time.split(":").map(Number);
    const now = new Date();
    const target = new Date(now);

    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
}

function buildNotificationTag(entry: ReminderEntry) {
    return `myfitness-${entry.kind}-${getReminderDateKey()}-${entry.dedupeId}`;
}

function wasShownToday(entry: ReminderEntry) {
    return localStorage.getItem(buildNotificationTag(entry)) === "shown";
}

function markShownToday(entry: ReminderEntry) {
    localStorage.setItem(buildNotificationTag(entry), "shown");
}

async function showReminder(entry: ReminderEntry) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    if (wasShownToday(entry)) return;

    const template = REMINDER_TEMPLATES[entry.kind];
    const options: NotificationOptions = {
        body: template.body,
        icon: template.icon,
        badge: template.icon,
        tag: buildNotificationTag(entry),
        data: { url: template.url },
    };

    const registration = "serviceWorker" in navigator
        ? await navigator.serviceWorker.getRegistration("/")
        : null;

    if (registration) {
        await registration.showNotification(template.title, options);
    } else {
        new Notification(template.title, options);
    }

    markShownToday(entry);
}

async function loadReminderEntries(): Promise<ReminderEntry[]> {
    const settings = await getNotificationSettings();
    const entries: ReminderEntry[] = [];

    if (settings.notifications_enabled) {
        for (const field of TIME_FIELDS) {
            entries.push({
                kind: field,
                time: settings[field],
                dedupeId: field,
            });
        }
    }

    const waterSchedules = await getWaterSchedules();
    for (const schedule of waterSchedules) {
        entries.push({
            kind: "water_reminder",
            time: schedule.time,
            dedupeId: `water-${schedule.id}`,
        });
    }

    return entries;
}

export function dispatchReminderScheduleRefresh() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(REMINDER_EVENT));
}

export default function ReminderScheduler() {
    const entriesRef = useRef<ReminderEntry[]>([]);
    const intervalRef = useRef<number | null>(null);
    const timeoutRefs = useRef<number[]>([]);

    const checkDueReminders = useCallback(() => {
        const currentTime = getCurrentReminderTime();
        const dueEntries = entriesRef.current.filter((entry) => entry.time === currentTime);

        for (const entry of dueEntries) {
            showReminder(entry).catch((error) => {
                console.error("Failed to show reminder notification:", error);
            });
        }
    }, []);

    const clearExactTimers = useCallback(() => {
        for (const timeoutId of timeoutRefs.current) {
            window.clearTimeout(timeoutId);
        }
        timeoutRefs.current = [];
    }, []);

    const scheduleExactTimers = useCallback(() => {
        clearExactTimers();

        for (const entry of entriesRef.current) {
            const timeoutId = window.setTimeout(() => {
                showReminder(entry).catch((error) => {
                    console.error("Failed to show reminder notification:", error);
                });

                const intervalId = window.setInterval(() => {
                    showReminder(entry).catch((error) => {
                        console.error("Failed to show reminder notification:", error);
                    });
                }, ONE_DAY_MS);

                timeoutRefs.current.push(intervalId);
            }, getMsUntilTime(entry.time));

            timeoutRefs.current.push(timeoutId);
        }
    }, [clearExactTimers]);

    const refreshEntries = useCallback(async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            entriesRef.current = [];
            clearExactTimers();
            return;
        }

        entriesRef.current = await loadReminderEntries();
        scheduleExactTimers();
        checkDueReminders();
    }, [checkDueReminders, clearExactTimers, scheduleExactTimers]);

    useEffect(() => {
        if (!("Notification" in window)) return;

        refreshEntries().catch((error) => {
            console.error("Failed to load reminder schedule:", error);
        });

        intervalRef.current = window.setInterval(checkDueReminders, CHECK_INTERVAL_MS);

        const handleFocus = () => {
            refreshEntries().catch((error) => {
                console.error("Failed to refresh reminder schedule:", error);
            });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                handleFocus();
            }
        };

        window.addEventListener("focus", handleFocus);
        window.addEventListener(REMINDER_EVENT, handleFocus);
        document.addEventListener("visibilitychange", handleVisibilityChange);

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            handleFocus();
        });

        return () => {
            if (intervalRef.current !== null) {
                window.clearInterval(intervalRef.current);
            }
            clearExactTimers();
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener(REMINDER_EVENT, handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            subscription.unsubscribe();
        };
    }, [checkDueReminders, clearExactTimers, refreshEntries]);

    return null;
}
