"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getNotificationSettings } from "@/lib/notification-settings";
import {
    getCurrentReminderTime,
    getReminderDateKey,
    normalizeReminderTime,
    REMINDER_TEMPLATES,
} from "@/lib/reminder-notifications";
import type { ReminderKind, ReminderTemplate } from "@/lib/reminder-notifications";
import { supabase } from "@/lib/supabase";
import { getWaterSchedules } from "@/lib/water";
import { TIME_FIELDS } from "@/types/notification-settings";

type ReminderEntry = {
    kind: ReminderKind;
    time: string;
    dedupeId: string;
};

type ActiveReminder = ReminderTemplate & {
    tag: string;
};

const REMINDER_EVENT = "myfitness:reminders-updated";
const CHECK_INTERVAL_MS = 15_000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

function getMsUntilTime(time: string) {
    const [hours, minutes] = normalizeReminderTime(time).split(":").map(Number);
    const now = new Date();
    const target = new Date(now);

    target.setHours(hours, minutes, 0, 0);

    if (target.getTime() <= now.getTime()) {
        target.setDate(target.getDate() + 1);
    }

    return target.getTime() - now.getTime();
}

function buildNotificationTag(entry: ReminderEntry) {
    return `myfitness-${entry.kind}-${getReminderDateKey()}-${entry.time}-${entry.dedupeId}`;
}

function wasShownToday(entry: ReminderEntry) {
    return localStorage.getItem(buildNotificationTag(entry)) === "shown";
}

function markShownToday(entry: ReminderEntry) {
    localStorage.setItem(buildNotificationTag(entry), "shown");
}

async function showNativeReminder(template: ReminderTemplate, tag: string) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    const options: NotificationOptions = {
        body: template.body,
        icon: template.icon,
        badge: template.icon,
        tag,
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
}

async function showDueReminder(
    entry: ReminderEntry,
    showInAppReminder: (reminder: ActiveReminder) => void
) {
    if (wasShownToday(entry)) return;

    const template = REMINDER_TEMPLATES[entry.kind];
    const tag = buildNotificationTag(entry);

    showInAppReminder({ ...template, tag });
    markShownToday(entry);
    await showNativeReminder(template, tag);
}

async function loadReminderEntries(): Promise<ReminderEntry[]> {
    const settings = await getNotificationSettings();
    const entries: ReminderEntry[] = [];

    if (settings.notifications_enabled) {
        for (const field of TIME_FIELDS) {
            entries.push({
                kind: field,
                time: normalizeReminderTime(settings[field]),
                dedupeId: field,
            });
        }
    }

    try {
        const waterSchedules = await getWaterSchedules();
        for (const schedule of waterSchedules) {
            entries.push({
                kind: "water_reminder",
                time: normalizeReminderTime(schedule.time),
                dedupeId: `water-${schedule.id}`,
            });
        }
    } catch (error) {
        console.warn("Failed to load water reminders:", error);
    }

    return entries;
}

export function dispatchReminderScheduleRefresh() {
    if (typeof window === "undefined") return;
    window.dispatchEvent(new Event(REMINDER_EVENT));
}

export default function ReminderScheduler() {
    const [activeReminder, setActiveReminder] = useState<ActiveReminder | null>(null);
    const entriesRef = useRef<ReminderEntry[]>([]);
    const intervalRef = useRef<number | null>(null);
    const timeoutRefs = useRef<number[]>([]);
    const dismissTimeoutRef = useRef<number | null>(null);

    const showInAppReminder = useCallback((reminder: ActiveReminder) => {
        setActiveReminder(reminder);

        if (dismissTimeoutRef.current !== null) {
            window.clearTimeout(dismissTimeoutRef.current);
        }

        dismissTimeoutRef.current = window.setTimeout(() => {
            setActiveReminder((current) => (current?.tag === reminder.tag ? null : current));
        }, 12_000);
    }, []);

    const checkDueReminders = useCallback(() => {
        const currentTime = getCurrentReminderTime();
        const dueEntries = entriesRef.current.filter((entry) => entry.time === currentTime);

        for (const entry of dueEntries) {
            showDueReminder(entry, showInAppReminder).catch((error) => {
                console.error("Failed to show reminder notification:", error);
            });
        }
    }, [showInAppReminder]);

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
                showDueReminder(entry, showInAppReminder).catch((error) => {
                    console.error("Failed to show reminder notification:", error);
                });

                const intervalId = window.setInterval(() => {
                    showDueReminder(entry, showInAppReminder).catch((error) => {
                        console.error("Failed to show reminder notification:", error);
                    });
                }, ONE_DAY_MS);

                timeoutRefs.current.push(intervalId);
            }, getMsUntilTime(entry.time));

            timeoutRefs.current.push(timeoutId);
        }
    }, [clearExactTimers, showInAppReminder]);

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
            if (dismissTimeoutRef.current !== null) {
                window.clearTimeout(dismissTimeoutRef.current);
            }
            clearExactTimers();
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener(REMINDER_EVENT, handleFocus);
            document.removeEventListener("visibilitychange", handleVisibilityChange);
            subscription.unsubscribe();
        };
    }, [checkDueReminders, clearExactTimers, refreshEntries]);

    if (!activeReminder) return null;

    return (
        <div
            role="status"
            aria-live="polite"
            className="fixed left-4 right-4 top-[max(1rem,env(safe-area-inset-top,0px))] z-50 mx-auto max-w-md rounded-2xl border border-amber-300/25 bg-slate-950/95 p-4 text-white shadow-2xl shadow-black/40 backdrop-blur-md"
        >
            <div className="flex items-start gap-3">
                <span
                    aria-hidden="true"
                    className="mt-0.5 h-10 w-10 shrink-0 rounded-xl bg-cover bg-center"
                    style={{ backgroundImage: `url(${activeReminder.icon})` }}
                />
                <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white">{activeReminder.title}</p>
                    <p className="mt-1 text-sm leading-5 text-white/70">{activeReminder.body}</p>
                </div>
                <button
                    type="button"
                    onClick={() => setActiveReminder(null)}
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/5 text-lg leading-none text-white/60 active:bg-white/10"
                    aria-label="Dong thong bao"
                >
                    x
                </button>
            </div>
        </div>
    );
}
