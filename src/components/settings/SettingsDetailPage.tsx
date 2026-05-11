"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { dispatchReminderScheduleRefresh } from "@/components/ReminderScheduler";
import {
    ArrowLeft,
    BellRing,
    CalendarDays,
    LogIn,
    Save,
    SendHorizonal,
    Timer,
    UserRound,
} from "lucide-react";
import NotificationPermission from "@/components/NotificationPermission";
import { getNotificationSettings, saveNotificationSettings } from "@/lib/notification-settings";
import { getNutritionGoal, saveNutritionGoal } from "@/lib/nutrition-goals";
import { createWorkoutSession, getWorkoutSessions, updateWorkoutSession } from "@/lib/schedule";
import { supabase } from "@/lib/supabase";
import { getUserProfile, saveUserProfile } from "@/lib/user-profile";
import {
    DEFAULT_NOTIFICATION_SETTINGS,
    NotificationSettingsUpsert,
    TIME_FIELD_ICONS,
    TIME_FIELD_LABELS,
    TIME_FIELDS,
    TimeFieldKey,
} from "@/types/notification-settings";
import {
    DEFAULT_NUTRITION_GOAL,
    NUTRITION_FIELDS,
    NUTRITION_ICONS,
    NUTRITION_LABELS,
    NUTRITION_UNITS,
} from "@/types/nutrition-goal";
import type { NutritionFieldKey, NutritionGoalUpsert } from "@/types/nutrition-goal";
import {
    BODY_MEASUREMENT_ICONS,
    BODY_MEASUREMENT_KEYS,
    BODY_MEASUREMENT_LABELS,
    DEFAULT_USER_PROFILE,
    GENDER_LABELS,
} from "@/types/user-profile";
import type { Gender, UserProfileUpsert } from "@/types/user-profile";
import type { DayOfWeek, WorkoutSession } from "@/types/schedule";
import { DAY_FULL_LABELS } from "@/types/schedule";
import type { User } from "@supabase/supabase-js";

export type SettingsSection = "profile" | "nutrition" | "workout" | "reminders";

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

const SECTION_TITLES: Record<SettingsSection, string> = {
    profile: "Thông tin profile",
    nutrition: "Mục tiêu dinh dưỡng",
    workout: "Lịch tập luyện",
    reminders: "Lịch nhắc nhở",
};

const DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

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

interface SettingsRowProps {
    icon: ReactNode;
    label: string;
    children: ReactNode;
    helper?: string;
}

function SettingsRow({ icon, label, children, helper }: SettingsRowProps) {
    return (
        <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3.5 backdrop-blur-md">
            <span className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0 text-lg text-white/70">
                {icon}
            </span>
            <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white/85">{label}</p>
                {helper && <p className="mt-0.5 truncate text-xs text-white/35">{helper}</p>}
            </div>
            <div className="shrink-0">{children}</div>
        </div>
    );
}

interface NumberValueInputProps {
    value: number | null;
    unit: string;
    min: number;
    max?: number;
    step: number;
    onChange: (value: string) => void;
}

function NumberValueInput({
    value,
    unit,
    min,
    max,
    step,
    onChange,
}: NumberValueInputProps) {
    return (
        <div className="flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-3 py-2">
            <input
                type="number"
                inputMode={step % 1 === 0 ? "numeric" : "decimal"}
                min={min}
                max={max}
                step={step}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder="--"
                className="input-number-plain w-16 bg-transparent text-right text-sm font-semibold text-white outline-none placeholder:text-white/20"
            />
            <span className="text-xs text-white/35">{unit}</span>
        </div>
    );
}

interface SettingsDetailPageProps {
    section: SettingsSection;
}

export default function SettingsDetailPage({ section }: SettingsDetailPageProps) {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [settings, setSettings] = useState<NotificationSettingsUpsert>(
        DEFAULT_NOTIFICATION_SETTINGS
    );
    const [profile, setProfile] = useState<UserProfileUpsert>(DEFAULT_USER_PROFILE);
    const [nutritionGoal, setNutritionGoal] = useState<NutritionGoalUpsert>(
        DEFAULT_NUTRITION_GOAL
    );
    const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saveMessage, setSaveMessage] = useState("");
    const [hasChanges, setHasChanges] = useState(false);
    const [togglingDay, setTogglingDay] = useState<DayOfWeek | null>(null);
    const [testingPush, setTestingPush] = useState(false);
    const [testPushMessage, setTestPushMessage] = useState("");

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadSettings = useCallback(async () => {
        if (!user) return;

        setDataLoading(true);
        try {
            if (section === "profile") {
                setProfile(await getUserProfile());
            }

            if (section === "nutrition") {
                setNutritionGoal(await getNutritionGoal());
            }

            if (section === "reminders") {
                const nextSettings = await getNotificationSettings();
                setSettings({ ...nextSettings, notifications_enabled: true });
            }

            if (section === "workout") {
                const sessions = await getWorkoutSessions();
                setWorkoutSessions(sessions.filter((session) => session.week_number === 1));
            }

            setHasChanges(false);
            setSaveMessage("");
        } catch (e) {
            console.error("Failed to load settings:", e);
        } finally {
            setDataLoading(false);
        }
    }, [section, user]);

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

    const handleDelayChange = (value: string) => {
        const nextValue = Number(value);
        if (Number.isNaN(nextValue)) return;

        setSettings((prev) => ({ ...prev, reminder_delay_minutes: nextValue }));
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

    const handleToggleWorkoutDay = async (day: DayOfWeek) => {
        setTogglingDay(day);
        try {
            const existingSession = workoutSessions.find((session) => session.day_of_week === day);
            const isCurrentlyRest = existingSession ? existingSession.is_rest_day : true;

            if (existingSession) {
                const updated = await updateWorkoutSession(existingSession.id, {
                    is_rest_day: !isCurrentlyRest,
                });
                setWorkoutSessions((prev) =>
                    prev.map((session) => (session.id === updated.id ? updated : session))
                );
            } else {
                const created = await createWorkoutSession({
                    day_of_week: day,
                    week_number: 1,
                    title: `Buổi tập ${DAY_FULL_LABELS[day]}`,
                    exercises: [],
                    is_rest_day: false,
                });
                setWorkoutSessions((prev) => [...prev, created]);
            }
        } finally {
            setTogglingDay(null);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        setSaving(true);
        setSaveMessage("");
        try {
            if (section === "profile") {
                const normalizedProfile = normalizeUserProfile(profile);
                await saveUserProfile(normalizedProfile);
                setProfile(normalizedProfile);
            }

            if (section === "nutrition") {
                const normalizedNutritionGoal = normalizeNutritionGoal(nutritionGoal);
                await saveNutritionGoal(normalizedNutritionGoal);
                setNutritionGoal(normalizedNutritionGoal);
            }

            if (section === "reminders") {
                await saveNotificationSettings({ ...settings, notifications_enabled: true });
                dispatchReminderScheduleRefresh();
            }

            setSaveMessage("Đã lưu cài đặt thành công!");
            setHasChanges(false);
        } catch (e) {
            setSaveMessage("Lỗi khi lưu cài đặt");
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleTestPush = async () => {
        setTestingPush(true);
        setTestPushMessage("");
        try {
            const response = await fetch("/api/send-notification", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    action: "send-to-user",
                    user_id: user!.id,
                    payload: {
                        title: "🎉 My Fitness",
                        body: "Push notification đang hoạt động! Bạn sẽ nhận được thông báo ngay cả khi thoát app.",
                        icon: "/icons/icon-192x192.png",
                        url: "/",
                    },
                }),
            });

            if (response.ok) {
                setTestPushMessage("✅ Đã gửi thông báo thử nghiệm!");
            } else {
                setTestPushMessage("❌ Gửi thất bại. Vui lòng thử lại.");
            }
        } catch (err) {
            setTestPushMessage("❌ Lỗi kết nối. Vui lòng thử lại.");
            console.error("Test push failed:", err);
        } finally {
            setTestingPush(false);
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

    const renderProfileSection = () => (
        <div className="space-y-3">
            <SettingsRow icon="⚧" label="Giới tính">
                <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/5 border border-white/10 p-1">
                    {(["male", "female"] as Gender[]).map((gender) => (
                        <button
                            key={gender}
                            type="button"
                            onClick={() => handleGenderChange(gender)}
                            className={`min-w-0 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                profile.gender === gender
                                    ? "bg-cyan-500/25 text-cyan-100"
                                    : "text-white/45 active:bg-white/10"
                            }`}
                        >
                            {GENDER_LABELS[gender]}
                        </button>
                    ))}
                </div>
            </SettingsRow>

            {PROFILE_BASIC_FIELDS.map((field) => (
                <SettingsRow key={field.key} icon={field.icon} label={field.label}>
                    <NumberValueInput
                        value={profile[field.key]}
                        unit={field.unit}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        onChange={(value) => handleProfileNumberChange(field.key, value)}
                    />
                </SettingsRow>
            ))}

            <div className="pt-2">
                <div className="mb-2 flex items-center gap-2 px-1">
                    <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-xs">
                        📏
                    </span>
                    <p className="text-xs font-semibold text-white/45">Số đo cơ thể</p>
                </div>
                <div className="space-y-3">
                    {BODY_MEASUREMENT_KEYS.map((field) => (
                        <SettingsRow
                            key={field}
                            icon={BODY_MEASUREMENT_ICONS[field]}
                            label={BODY_MEASUREMENT_LABELS[field]}
                        >
                            <NumberValueInput
                                value={profile[field]}
                                unit="cm"
                                min={1}
                                step={0.1}
                                onChange={(value) => handleProfileNumberChange(field, value)}
                            />
                        </SettingsRow>
                    ))}
                </div>
            </div>
        </div>
    );

    const renderNutritionSection = () => (
        <div className="space-y-3">
            {NUTRITION_FIELDS.map((field) => (
                <SettingsRow
                    key={field}
                    icon={NUTRITION_ICONS[field]}
                    label={NUTRITION_LABELS[field]}
                >
                    <NumberValueInput
                        value={nutritionGoal[field]}
                        unit={NUTRITION_UNITS[field]}
                        min={1}
                        step={NUTRITION_STEPS[field]}
                        onChange={(value) => handleNutritionChange(field, value)}
                    />
                </SettingsRow>
            ))}
        </div>
    );

    const renderWorkoutSection = () => (
        <div className="space-y-3">
            {DAYS.map((day) => {
                const session = workoutSessions.find((item) => item.day_of_week === day);
                const isWorkout = Boolean(session && !session.is_rest_day);
                const isToggling = togglingDay === day;

                return (
                    <SettingsRow
                        key={day}
                        icon={<CalendarDays className="w-5 h-5" />}
                        label={DAY_FULL_LABELS[day]}
                        helper={isWorkout ? "Đang đặt là ngày tập" : "Đang đặt là ngày nghỉ"}
                    >
                        <button
                            onClick={() => handleToggleWorkoutDay(day)}
                            disabled={isToggling}
                            className={`min-w-[96px] rounded-xl border px-3 py-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
                                isWorkout
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                                    : "bg-red-500/10 border-red-500/25 text-red-300"
                            }`}
                        >
                            {isToggling ? "Đang đổi..." : isWorkout ? "Ngày tập" : "Ngày nghỉ"}
                        </button>
                    </SettingsRow>
                );
            })}
        </div>
    );

    const renderReminderSection = () => (
        <div className="space-y-3">
            {/* ── Trạng thái thông báo ── */}
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-md">
                <div className="flex items-center gap-2 mb-3">
                    <BellRing className="w-4 h-4 text-amber-400" />
                    <p className="text-sm font-semibold text-white/85">Trạng thái thông báo đẩy</p>
                </div>
                <NotificationPermission />
            </div>

            {/* ── Nút test push ── */}
            <button
                onClick={handleTestPush}
                disabled={testingPush}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 border border-indigo-500/30 text-indigo-300 font-medium text-sm active:from-indigo-500/30 active:to-cyan-500/30 transition-colors disabled:opacity-50"
            >
                <SendHorizonal className="w-4 h-4" />
                {testingPush ? "Đang gửi thử nghiệm..." : "Gửi thông báo thử nghiệm"}
            </button>
            {testPushMessage && (
                <p className={`text-xs text-center px-4 py-2 rounded-lg ${
                    testPushMessage.startsWith("✅")
                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                        : "bg-red-500/10 text-red-300 border border-red-500/20"
                }`}>
                    {testPushMessage}
                </p>
            )}

            {/* ── Cài đặt giờ nhắc nhở ── */}
            <div className="pt-2">
                <div className="mb-2 flex items-center gap-2 px-1">
                    <span className="w-5 h-5 rounded-lg bg-white/5 flex items-center justify-center text-xs">⏰</span>
                    <p className="text-xs font-semibold text-white/45">Giờ nhắc nhở</p>
                </div>
            </div>

            {TIME_FIELDS.map((field) => (
                <SettingsRow
                    key={field}
                    icon={TIME_FIELD_ICONS[field]}
                    label={TIME_FIELD_LABELS[field]}
                >
                    <input
                        type="time"
                        value={settings[field]}
                        onChange={(e) => handleTimeChange(field, e.target.value)}
                        className="rounded-xl bg-white/5 border border-white/10 px-3 py-2 text-right text-sm font-semibold text-white outline-none focus:border-indigo-500/50 [color-scheme:dark]"
                    />
                </SettingsRow>
            ))}

            <SettingsRow icon={<Timer className="w-5 h-5" />} label="Nhắc lại sau">
                <NumberValueInput
                    value={settings.reminder_delay_minutes}
                    unit="phút"
                    min={15}
                    max={120}
                    step={5}
                    onChange={handleDelayChange}
                />
            </SettingsRow>
        </div>
    );

    const renderSection = () => {
        if (dataLoading) {
            return (
                <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
            );
        }

        if (section === "profile") return renderProfileSection();
        if (section === "nutrition") return renderNutritionSection();
        if (section === "workout") return renderWorkoutSection();
        return renderReminderSection();
    };

    if (authLoading) {
        return (
            <main className="p-5 min-h-full flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </main>
        );
    }

    if (!user) {
        return (
            <main
                className="p-5 min-h-full flex flex-col"
                style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
            >
                <header className="mb-6 flex items-center gap-3">
                    <Link
                        href="/settings"
                        className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 active:bg-white/10"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-xl font-bold text-white/90">
                        {SECTION_TITLES[section]}
                    </h1>
                </header>

                <div className="flex-1 flex flex-col items-center justify-center gap-5 text-center">
                    <UserRound className="w-12 h-12 text-white/20" />
                    <div>
                        <h2 className="text-lg font-bold text-white/90">Chưa đăng nhập</h2>
                        <p className="mt-1 text-sm text-white/50">
                            Đăng nhập để mở cài đặt cá nhân của bạn.
                        </p>
                    </div>
                    <button
                        onClick={handleLogin}
                        className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 font-semibold active:bg-gray-100 transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        Đăng nhập với Google
                    </button>
                </div>
            </main>
        );
    }

    return (
        <main
            className="p-5 min-h-full"
            style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
            <header className="mb-5 flex items-center gap-3">
                <Link
                    href="/settings"
                    className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/70 active:bg-white/10"
                >
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="min-w-0">
                    <p className="text-xs font-medium text-white/40">Cài đặt</p>
                    <h1 className="truncate text-xl font-bold text-white/90">
                        {SECTION_TITLES[section]}
                    </h1>
                </div>
            </header>

            <div className="space-y-3">
                {renderSection()}

                {section !== "workout" && (hasChanges || saveMessage) && (
                    <div className="space-y-3">
                        {hasChanges && (
                            <button
                                onClick={handleSave}
                                disabled={saving || dataLoading}
                                className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 font-medium text-sm active:bg-indigo-500/30 transition-colors disabled:opacity-50"
                            >
                                <Save className="w-4 h-4" />
                                {saving ? "Đang lưu..." : "Lưu cài đặt"}
                            </button>
                        )}

                        {saveMessage && (
                            <p
                                className={`text-xs text-center px-4 py-2 rounded-lg ${
                                    saveMessage.startsWith("Đã")
                                        ? "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                        : "bg-red-500/10 text-red-300 border border-red-500/20"
                                }`}
                            >
                                {saveMessage}
                            </p>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
