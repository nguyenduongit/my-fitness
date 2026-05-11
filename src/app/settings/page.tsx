"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, Bell, Timer, Save, CalendarDays, ChevronRight } from "lucide-react";
import NotificationPermission from "@/components/NotificationPermission";
import ScheduleSettingsModal from "@/components/ScheduleSettingsModal";
import { supabase } from "@/lib/supabase";
import {
    getNotificationSettings,
    saveNotificationSettings,
} from "@/lib/notification-settings";
import {
    NotificationSettingsUpsert,
    DEFAULT_NOTIFICATION_SETTINGS,
    TIME_FIELD_LABELS,
    TIME_FIELD_ICONS,
    TIME_FIELDS,
    TimeFieldKey,
} from "@/types/notification-settings";
import { User } from "@supabase/supabase-js";

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<NotificationSettingsUpsert>(
        DEFAULT_NOTIFICATION_SETTINGS
    );
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [hasChanges, setHasChanges] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Load notification settings
    const loadSettings = useCallback(async () => {
        if (!user) return;
        setSettingsLoading(true);
        try {
            const data = await getNotificationSettings();
            setSettings(data);
        } catch (e) {
            console.error("Failed to load notification settings:", e);
        } finally {
            setSettingsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleTimeChange = (field: TimeFieldKey, value: string) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
        setHasChanges(true);
        setSaveMessage("");
    };

    const handleDelayChange = (value: number) => {
        setSettings((prev) => ({ ...prev, reminder_delay_minutes: value }));
        setHasChanges(true);
        setSaveMessage("");
    };

    const handleToggleEnabled = () => {
        setSettings((prev) => ({
            ...prev,
            notifications_enabled: !prev.notifications_enabled,
        }));
        setHasChanges(true);
        setSaveMessage("");
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveMessage("");
        try {
            await saveNotificationSettings(settings);
            setSaveMessage("✅ Đã lưu cài đặt thành công!");
            setHasChanges(false);
        } catch (e) {
            setSaveMessage("❌ Lỗi khi lưu cài đặt");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + "/auth/callback",
            },
        });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
    };

    return (
        <main
            className="p-5 min-h-full"
            style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-6">
                Cài đặt
            </h1>

            <div className="space-y-4">
                {/* ── Schedule Settings ──────────────────────────────────────────────── */}
                {user && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-4">
                            <CalendarDays className="w-4 h-4 text-emerald-400" />
                            <h3 className="font-semibold text-base text-white/90">Lịch tập luyện</h3>
                        </div>
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                        >
                            <span className="text-sm text-white/80 font-medium">Tuỳ chỉnh ngày tập / ngày nghỉ</span>
                            <ChevronRight className="w-4 h-4 text-white/40" />
                        </button>
                    </div>
                )}

                {/* ── Notification Permission ───────────────────────────────────────── */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-4">
                        <Bell className="w-4 h-4 text-indigo-400" />
                        <h3 className="font-semibold text-base text-white/90">Thông báo</h3>
                    </div>
                    <NotificationPermission />
                </div>

                {/* ── Time Settings ─────────────────────────────────────────────────── */}
                {user && (
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="w-4 h-4 text-amber-400" />
                            <h3 className="font-semibold text-base text-white/90">Lịch nhắc nhở</h3>
                        </div>

                        {settingsLoading ? (
                            <div className="flex justify-center py-6">
                                <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            </div>
                        ) : (
                            <>
                                {/* Enabled toggle */}
                                <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 mb-4">
                                    <div className="flex items-center gap-2">
                                        <Bell className="w-3.5 h-3.5 text-white/50" />
                                        <span className="text-sm text-white/70">Bật nhắc nhở</span>
                                    </div>
                                    <button
                                        onClick={handleToggleEnabled}
                                        className={`relative w-12 h-7 rounded-full transition-colors ${
                                            settings.notifications_enabled
                                                ? "bg-indigo-500"
                                                : "bg-white/10"
                                        }`}
                                    >
                                        <div
                                            className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                                                settings.notifications_enabled
                                                    ? "translate-x-6"
                                                    : "translate-x-1"
                                            }`}
                                        />
                                    </button>
                                </div>

                                {/* Time fields */}
                                <div className="space-y-2.5">
                                    {TIME_FIELDS.map((field) => (
                                        <div
                                            key={field}
                                            className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <span className="text-lg">{TIME_FIELD_ICONS[field]}</span>
                                                <span className="text-sm text-white/70">
                                                    {TIME_FIELD_LABELS[field]}
                                                </span>
                                            </div>
                                            <input
                                                type="time"
                                                value={settings[field]}
                                                onChange={(e) => handleTimeChange(field, e.target.value)}
                                                className="bg-white/10 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white font-medium focus:outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Reminder delay */}
                                <div className="mt-4 p-3 rounded-xl bg-white/5 border border-white/5">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <Timer className="w-3.5 h-3.5 text-white/50" />
                                            <span className="text-sm text-white/70">Nhắc lại sau</span>
                                        </div>
                                        <span className="text-sm font-medium text-indigo-400">
                                            {settings.reminder_delay_minutes} phút
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min={15}
                                        max={120}
                                        step={5}
                                        value={settings.reminder_delay_minutes}
                                        onChange={(e) => handleDelayChange(Number(e.target.value))}
                                        className="w-full accent-indigo-500 h-1"
                                    />
                                    <div className="flex justify-between mt-1">
                                        <span className="text-[10px] text-white/25">15 phút</span>
                                        <span className="text-[10px] text-white/25">120 phút</span>
                                    </div>
                                </div>

                                {/* Save button */}
                                {hasChanges && (
                                    <button
                                        onClick={handleSave}
                                        disabled={saving}
                                        className="mt-4 w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-medium text-sm active:bg-indigo-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <Save className="w-4 h-4" />
                                        {saving ? "Đang lưu..." : "Lưu cài đặt"}
                                    </button>
                                )}

                                {/* Status message */}
                                {saveMessage && (
                                    <p
                                        className={`mt-3 text-xs text-center px-4 py-2 rounded-lg ${
                                            saveMessage.startsWith("✅")
                                                ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                                : "bg-red-500/10 text-red-300 border border-red-500/20"
                                        }`}
                                    >
                                        {saveMessage}
                                    </p>
                                )}
                            </>
                        )}

                        {/* Explanation */}
                        <div className="mt-4 p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/10">
                            <p className="text-[11px] text-white/40 leading-relaxed">
                                💡 Hệ thống sẽ nhắc bạn khi đến giờ ăn/tập, và nhắc lại sau
                                thời gian đã cài đặt để hỏi bạn đã hoàn thành chưa.
                            </p>
                        </div>
                    </div>
                )}

                {/* ── Account ───────────────────────────────────────────────────────── */}
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                    <h3 className="font-semibold text-base text-white/90 mb-4">Tài khoản</h3>

                    {loading ? (
                        <p className="text-white/50 text-sm">Đang tải...</p>
                    ) : user ? (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {user.user_metadata?.avatar_url ? (
                                    <img
                                        src={user.user_metadata.avatar_url}
                                        alt="Avatar"
                                        className="w-12 h-12 rounded-full border border-white/10"
                                        referrerPolicy="no-referrer"
                                    />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                )}
                                <div>
                                    <p className="text-white/90 font-medium">
                                        {user.user_metadata?.full_name || user.email}
                                    </p>
                                    <p className="text-white/50 text-xs">{user.email}</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 active:bg-red-500/30 border border-red-500/20 rounded-xl text-red-400 font-medium transition-colors"
                            >
                                Đăng xuất
                            </button>
                        </div>
                    ) : (
                        <div>
                            <p className="text-white/50 text-sm">Chưa đăng nhập</p>
                            <button
                                onClick={handleLogin}
                                className="mt-4 w-full py-3 flex items-center justify-center gap-2 bg-white hover:bg-gray-100 active:bg-gray-200 rounded-xl text-slate-900 font-medium transition-colors"
                            >
                                <svg className="w-5 h-5" viewBox="0 0 24 24">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Đăng nhập với Google
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showScheduleModal && (
                <ScheduleSettingsModal onClose={() => setShowScheduleModal(false)} />
            )}
        </main>
    );
}
