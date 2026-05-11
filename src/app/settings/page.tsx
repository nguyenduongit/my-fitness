"use client";

import { useEffect, useState, useCallback } from "react";
import {
    Clock,
    Bell,
    Timer,
    Save,
    CalendarDays,
    ChevronRight,
    UserRound,
    Ruler,
    Target,
} from "lucide-react";
import NotificationPermission from "@/components/NotificationPermission";
import type { PushPermissionState } from "@/components/NotificationPermission";
import SettingsBlock from "@/components/SettingsBlock";
import ScheduleSettingsModal from "@/components/ScheduleSettingsModal";
import { supabase } from "@/lib/supabase";
import { isPushSupported } from "@/lib/push.utils";
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
import {
    getUserProfile,
    saveUserProfile,
} from "@/lib/user-profile";
import {
    DEFAULT_USER_PROFILE,
    GENDER_LABELS,
    BODY_MEASUREMENT_ICONS,
    BODY_MEASUREMENT_KEYS,
    BODY_MEASUREMENT_LABELS,
} from "@/types/user-profile";
import type { Gender, UserProfileUpsert } from "@/types/user-profile";
import {
    getNutritionGoal,
    saveNutritionGoal,
} from "@/lib/nutrition-goals";
import {
    DEFAULT_NUTRITION_GOAL,
    NUTRITION_FIELDS,
    NUTRITION_ICONS,
    NUTRITION_LABELS,
    NUTRITION_UNITS,
} from "@/types/nutrition-goal";
import type { NutritionFieldKey, NutritionGoalUpsert } from "@/types/nutrition-goal";
import { User } from "@supabase/supabase-js";

type ProfileNumberField = Exclude<keyof UserProfileUpsert, "gender">;

const PROFILE_BASIC_FIELDS: {
    key: ProfileNumberField;
    label: string;
    unit: string;
    min: number;
    max?: number;
    step: number;
    icon: string;
}[] = [
    { key: "age", label: "Tuổi", unit: "tuổi", min: 1, max: 199, step: 1, icon: "🎂" },
    { key: "height_cm", label: "Chiều cao", unit: "cm", min: 1, step: 0.1, icon: "📐" },
    { key: "weight_kg", label: "Cân nặng", unit: "kg", min: 1, step: 0.1, icon: "⚖️" },
];

const NUTRITION_STEPS: Record<NutritionFieldKey, number> = {
    calories: 50,
    protein_g: 1,
    carbs_g: 1,
    fat_g: 1,
    water_ml: 100,
};

function normalizePositiveNumber(value: number | null): number | null {
    if (value == null || Number.isNaN(value) || value <= 0) return null;
    return value;
}

function normalizeUserProfile(profile: UserProfileUpsert): UserProfileUpsert {
    const age = normalizePositiveNumber(profile.age);

    return {
        age: age == null ? null : Math.min(199, Math.round(age)),
        gender: profile.gender,
        height_cm: normalizePositiveNumber(profile.height_cm),
        weight_kg: normalizePositiveNumber(profile.weight_kg),
        chest_cm: normalizePositiveNumber(profile.chest_cm),
        waist_cm: normalizePositiveNumber(profile.waist_cm),
        hip_cm: normalizePositiveNumber(profile.hip_cm),
        bicep_cm: normalizePositiveNumber(profile.bicep_cm),
        thigh_cm: normalizePositiveNumber(profile.thigh_cm),
    };
}

function normalizeGoalNumber(value: number, fallback: number): number {
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeNutritionGoal(goal: NutritionGoalUpsert): NutritionGoalUpsert {
    return {
        calories: Math.round(normalizeGoalNumber(goal.calories, DEFAULT_NUTRITION_GOAL.calories)),
        protein_g: normalizeGoalNumber(goal.protein_g, DEFAULT_NUTRITION_GOAL.protein_g),
        carbs_g: normalizeGoalNumber(goal.carbs_g, DEFAULT_NUTRITION_GOAL.carbs_g),
        fat_g: normalizeGoalNumber(goal.fat_g, DEFAULT_NUTRITION_GOAL.fat_g),
        water_ml: Math.round(normalizeGoalNumber(goal.water_ml, DEFAULT_NUTRITION_GOAL.water_ml)),
    };
}

function formatMetric(value: number | null | undefined, unit: string): string {
    if (value == null) return "--";
    return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${unit}`;
}

function formatGoal(value: number, unit: string): string {
    return `${value.toLocaleString("vi-VN", { maximumFractionDigits: 1 })} ${unit}`;
}

const NOTIFICATION_PERMISSION_LABELS: Record<PushPermissionState, string> = {
    loading: "Đang kiểm tra",
    unsupported: "Không hỗ trợ",
    default: "Chưa bật",
    granted: "Đã bật",
    denied: "Bị chặn",
};

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [settings, setSettings] = useState<NotificationSettingsUpsert>(
        DEFAULT_NOTIFICATION_SETTINGS
    );
    const [profile, setProfile] = useState<UserProfileUpsert>(
        DEFAULT_USER_PROFILE
    );
    const [nutritionGoal, setNutritionGoal] = useState<NutritionGoalUpsert>(
        DEFAULT_NUTRITION_GOAL
    );
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [hasChanges, setHasChanges] = useState(false);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [notificationPermission, setNotificationPermission] =
        useState<PushPermissionState>("loading");

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

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setNotificationPermission(
                isPushSupported() ? Notification.permission : "unsupported"
            );
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, []);

    // Load user settings
    const loadSettings = useCallback(async () => {
        if (!user) return;
        await Promise.resolve();
        setSettingsLoading(true);
        try {
            const [notificationData, profileData, nutritionData] = await Promise.all([
                getNotificationSettings(),
                getUserProfile(),
                getNutritionGoal(),
            ]);
            setSettings(notificationData);
            setProfile(profileData);
            setNutritionGoal(nutritionData);
            setHasChanges(false);
            setSaveMessage("");
        } catch (e) {
            console.error("Failed to load settings:", e);
        } finally {
            setSettingsLoading(false);
        }
    }, [user]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadSettings();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadSettings]);

    const markChanged = () => {
        setHasChanges(true);
        setSaveMessage("");
    };

    const handleTimeChange = (field: TimeFieldKey, value: string) => {
        setSettings((prev) => ({ ...prev, [field]: value }));
        markChanged();
    };

    const handleDelayChange = (value: number) => {
        setSettings((prev) => ({ ...prev, reminder_delay_minutes: value }));
        markChanged();
    };

    const handleToggleEnabled = () => {
        setSettings((prev) => ({
            ...prev,
            notifications_enabled: !prev.notifications_enabled,
        }));
        markChanged();
    };

    const handleProfileNumberChange = (
        field: ProfileNumberField,
        value: string
    ) => {
        const nextValue = value === "" ? null : Number(value);
        if (nextValue !== null && Number.isNaN(nextValue)) return;

        setProfile((prev) => ({ ...prev, [field]: nextValue }));
        markChanged();
    };

    const handleGenderChange = (gender: Gender) => {
        setProfile((prev) => ({ ...prev, gender }));
        markChanged();
    };

    const handleNutritionChange = (field: NutritionFieldKey, value: string) => {
        const nextValue = value === "" ? 0 : Number(value);
        if (Number.isNaN(nextValue)) return;

        setNutritionGoal((prev) => ({ ...prev, [field]: nextValue }));
        markChanged();
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setSaveMessage("");
        try {
            const normalizedProfile = normalizeUserProfile(profile);
            const normalizedNutritionGoal = normalizeNutritionGoal(nutritionGoal);

            await Promise.all([
                saveNotificationSettings(settings),
                saveUserProfile(normalizedProfile),
                saveNutritionGoal(normalizedNutritionGoal),
            ]);

            setProfile(normalizedProfile);
            setNutritionGoal(normalizedNutritionGoal);
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

    const profileSummary = [
        { icon: "🎂", label: "Tuổi", value: formatMetric(profile.age, "tuổi") },
        {
            icon: "⚧",
            label: "Giới tính",
            value: profile.gender ? GENDER_LABELS[profile.gender] : "--",
        },
        { icon: "📐", label: "Chiều cao", value: formatMetric(profile.height_cm, "cm") },
        { icon: "⚖️", label: "Cân nặng", value: formatMetric(profile.weight_kg, "kg") },
        ...BODY_MEASUREMENT_KEYS.map((field) => ({
            icon: BODY_MEASUREMENT_ICONS[field],
            label: BODY_MEASUREMENT_LABELS[field],
            value: formatMetric(profile[field], "cm"),
        })),
    ];

    const nutritionSummary = NUTRITION_FIELDS.map((field) => ({
        icon: NUTRITION_ICONS[field],
        label: NUTRITION_LABELS[field],
        value: formatGoal(nutritionGoal[field], NUTRITION_UNITS[field]),
    }));

    const reminderSummary = [
        {
            icon: <Bell className="w-3.5 h-3.5" />,
            label: "Nhắc nhở",
            value: settings.notifications_enabled ? "Bật" : "Tắt",
        },
        ...TIME_FIELDS.map((field) => ({
            icon: TIME_FIELD_ICONS[field],
            label: TIME_FIELD_LABELS[field],
            value: settings[field],
        })),
        {
            icon: <Timer className="w-3.5 h-3.5" />,
            label: "Nhắc lại sau",
            value: `${settings.reminder_delay_minutes} phút`,
        },
    ];

    const accountSummary = [
        {
            icon: <UserRound className="w-3.5 h-3.5" />,
            label: "Trạng thái",
            value: loading ? "Đang tải" : user ? "Đã đăng nhập" : "Chưa đăng nhập",
        },
        {
            icon: "✉️",
            label: "Email",
            value: user?.email ?? "--",
        },
    ];

    return (
        <main
            className="p-5 min-h-full"
            style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-6">
                Cài đặt
            </h1>

            <div className="space-y-3">
                {user && (
                    <SettingsBlock
                        title="Thông tin profile"
                        icon={<UserRound className="w-4 h-4 text-cyan-400" />}
                        summary={profileSummary}
                        loading={settingsLoading}
                    >
                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-base">⚧</span>
                                <span className="text-xs text-white/45 font-medium">Giới tính</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {(["male", "female", "other"] as Gender[]).map((gender) => (
                                    <button
                                        key={gender}
                                        type="button"
                                        onClick={() => handleGenderChange(gender)}
                                        className={`min-w-0 rounded-lg px-2.5 py-2 text-xs font-medium transition-colors ${
                                            profile.gender === gender
                                                ? "bg-cyan-500/25 text-cyan-200 border border-cyan-500/35"
                                                : "bg-white/5 text-white/45 border border-white/5 active:bg-white/10"
                                        }`}
                                    >
                                        {GENDER_LABELS[gender]}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2.5">
                            {PROFILE_BASIC_FIELDS.map((field) => (
                                <label
                                    key={field.key}
                                    className={
                                        field.key === "age"
                                            ? "block p-3 rounded-xl bg-white/5 border border-white/5 col-span-2"
                                            : "block p-3 rounded-xl bg-white/5 border border-white/5"
                                    }
                                >
                                    <span className="flex items-center gap-2 text-xs text-white/45 font-medium mb-2">
                                        <span className="text-base">{field.icon}</span>
                                        {field.label}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={field.min}
                                            max={field.max}
                                            step={field.step}
                                            value={profile[field.key] ?? ""}
                                            onChange={(e) =>
                                                handleProfileNumberChange(field.key, e.target.value)
                                            }
                                            placeholder="--"
                                            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/20"
                                        />
                                        <span className="shrink-0 text-xs text-white/35">{field.unit}</span>
                                    </div>
                                </label>
                            ))}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <Ruler className="w-3.5 h-3.5 text-white/35" />
                                <p className="text-xs font-medium text-white/45">Số đo cơ thể</p>
                            </div>
                            <div className="grid grid-cols-2 gap-2.5">
                                {BODY_MEASUREMENT_KEYS.map((field) => (
                                    <label
                                        key={field}
                                        className="block p-3 rounded-xl bg-white/5 border border-white/5"
                                    >
                                        <span className="flex items-center gap-2 text-xs text-white/45 font-medium mb-2">
                                            <span className="text-base">{BODY_MEASUREMENT_ICONS[field]}</span>
                                            {BODY_MEASUREMENT_LABELS[field]}
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                min={1}
                                                step={0.1}
                                                value={profile[field] ?? ""}
                                                onChange={(e) =>
                                                    handleProfileNumberChange(field, e.target.value)
                                                }
                                                placeholder="--"
                                                className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none placeholder:text-white/20"
                                            />
                                            <span className="shrink-0 text-xs text-white/35">cm</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </SettingsBlock>
                )}

                {user && (
                    <SettingsBlock
                        title="Mục tiêu dinh dưỡng ngày"
                        icon={<Target className="w-4 h-4 text-orange-400" />}
                        summary={nutritionSummary}
                        loading={settingsLoading}
                    >
                        <div className="grid grid-cols-2 gap-2.5">
                            {NUTRITION_FIELDS.map((field) => (
                                <label
                                    key={field}
                                    className="block p-3 rounded-xl bg-white/5 border border-white/5"
                                >
                                    <span className="flex items-center gap-2 text-xs text-white/45 font-medium mb-2">
                                        <span className="text-base">{NUTRITION_ICONS[field]}</span>
                                        {NUTRITION_LABELS[field]}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            min={1}
                                            step={NUTRITION_STEPS[field]}
                                            value={nutritionGoal[field]}
                                            onChange={(e) =>
                                                handleNutritionChange(field, e.target.value)
                                            }
                                            className="min-w-0 flex-1 bg-transparent text-base font-semibold text-white outline-none"
                                        />
                                        <span className="shrink-0 text-xs text-white/35">
                                            {NUTRITION_UNITS[field]}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </SettingsBlock>
                )}

                {user && (
                    <SettingsBlock
                        title="Lịch tập luyện"
                        icon={<CalendarDays className="w-4 h-4 text-emerald-400" />}
                        summary={[
                            {
                                icon: <CalendarDays className="w-3.5 h-3.5" />,
                                label: "Tuỳ chỉnh",
                                value: "Ngày tập / nghỉ",
                            },
                        ]}
                    >
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="w-full flex items-center justify-between p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                        >
                            <span className="text-sm text-white/80 font-medium">Tuỳ chỉnh ngày tập / ngày nghỉ</span>
                            <ChevronRight className="w-4 h-4 text-white/40" />
                        </button>
                    </SettingsBlock>
                )}

                <SettingsBlock
                    title="Thông báo"
                    icon={<Bell className="w-4 h-4 text-indigo-400" />}
                    summary={[
                        {
                            icon: <Bell className="w-3.5 h-3.5" />,
                            label: "Quyền thông báo",
                            value: NOTIFICATION_PERMISSION_LABELS[notificationPermission],
                        },
                    ]}
                >
                    <NotificationPermission onPermissionChange={setNotificationPermission} />
                </SettingsBlock>

                {user && (
                    <SettingsBlock
                        title="Lịch nhắc nhở"
                        icon={<Clock className="w-4 h-4 text-amber-400" />}
                        summary={reminderSummary}
                        loading={settingsLoading}
                    >
                        <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5">
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

                        <div className="p-3 rounded-xl bg-white/5 border border-white/5">
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
                    </SettingsBlock>
                )}

                {user && (hasChanges || saveMessage) && (
                    <div className="space-y-3">
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={saving || settingsLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-medium text-sm active:bg-indigo-500/30 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Đang lưu..." : "Lưu cài đặt"}
                            </button>
                        )}

                        {saveMessage && (
                            <p
                                className={`text-xs text-center px-4 py-2 rounded-lg ${
                                    saveMessage.startsWith("✅")
                                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                        : "bg-red-500/10 text-red-300 border border-red-500/20"
                                }`}
                            >
                                {saveMessage}
                            </p>
                        )}
                    </div>
                )}

                <SettingsBlock
                    title="Tài khoản"
                    icon={<UserRound className="w-4 h-4 text-sky-400" />}
                    summary={accountSummary}
                    loading={loading}
                >
                    {user ? (
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
                </SettingsBlock>
            </div>

            {showScheduleModal && (
                <ScheduleSettingsModal onClose={() => setShowScheduleModal(false)} />
            )}
        </main>
    );
}
