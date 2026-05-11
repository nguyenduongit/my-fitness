"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Dumbbell,
    TrendingUp,
    ChevronRight,
    LogIn,
    Utensils,
    CalendarDays,
    Zap,
    Target,
    Trophy,
    Check,
    Circle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMealPlanByDay } from "@/lib/meal-plans";
import { getWorkoutSessions } from "@/lib/schedule";
import { getCompletionsByDate, toggleCompletion } from "@/lib/completions";
import { getNutritionGoal } from "@/lib/nutrition-goals";
import {
    MealPlanItem,
    MEAL_TYPES,
    MEAL_LABELS,
    MEAL_ICONS,
} from "@/types/meal-plan";
import { DEFAULT_NUTRITION_GOAL } from "@/types/nutrition-goal";
import type { NutritionGoalUpsert } from "@/types/nutrition-goal";
import {
    WorkoutSession,
    DayOfWeek,
    CATEGORY_ICONS,
    DAY_FULL_LABELS,
} from "@/types/schedule";
import {
    DailyCompletion,
    isCompleted,
    WORKOUT_COMPLETION_KEY,
} from "@/types/completion";
import WeekStreak from "@/components/WeekStreak";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

function getCurrentDayOfWeek(): DayOfWeek {
    return new Date().getDay() as DayOfWeek;
}

function getGreeting(): string {
    const h = new Date().getHours();
    if (h < 12) return "Chào buổi sáng";
    if (h < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
}

function getUserDisplayName(user: User): string {
    return (
        user.user_metadata?.full_name ??
        user.user_metadata?.name ??
        user.email?.split("@")[0] ??
        "bạn"
    );
}

function getUserAvatar(user: User): string | null {
    return user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null;
}

// ─── Main ───────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [mounted, setMounted] = useState(false);

    const [mealItems, setMealItems] = useState<MealPlanItem[]>([]);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [completions, setCompletions] = useState<DailyCompletion[]>([]);
    const [nutritionGoal, setNutritionGoal] = useState<NutritionGoalUpsert>(
        DEFAULT_NUTRITION_GOAL
    );
    const [dataLoading, setDataLoading] = useState(false);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    const todayDow = getCurrentDayOfWeek();
    const today = toDateString(new Date());

    // Auth
    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            setMounted(true);
        }, 0);

        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_e, s) => {
            setUser(s?.user ?? null);
        });
        return () => {
            window.clearTimeout(timeoutId);
            subscription.unsubscribe();
        };
    }, []);

    // Load data
    const loadData = useCallback(async () => {
        if (!user) return;
        setDataLoading(true);
        try {
            const [meals, workouts, todayCompletions, savedNutritionGoal] = await Promise.all([
                getMealPlanByDay(todayDow),
                getWorkoutSessions(),
                getCompletionsByDate(today),
                getNutritionGoal(),
            ]);
            setMealItems(meals);
            setSessions(workouts);
            setCompletions(todayCompletions);
            setNutritionGoal(savedNutritionGoal);
        } catch (e) {
            console.error("Dashboard data load error:", e);
        } finally {
            setDataLoading(false);
        }
    }, [user, todayDow, today]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadData();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadData]);

    // ─── Toggle completion ──────────────────────────────────────────────────────

    const handleToggle = async (type: "meal" | "workout", refKey: string) => {
        const completed = isCompleted(completions, type, refKey);
        setTogglingKey(refKey);
        try {
            const result = await toggleCompletion(today, type, refKey, completed);
            if (result) {
                setCompletions((prev) => [...prev, result]);
            } else {
                setCompletions((prev) =>
                    prev.filter((c) => !(c.type === type && c.reference_key === refKey))
                );
            }
        } finally {
            setTogglingKey(null);
        }
    };

    // ─── Derived data ───────────────────────────────────────────────────────────

    const goal = useMemo(
        () => ({
            calories: Math.max(1, nutritionGoal.calories),
            protein: Math.max(1, nutritionGoal.protein_g),
            carbs: Math.max(1, nutritionGoal.carbs_g),
            fat: Math.max(1, nutritionGoal.fat_g),
        }),
        [nutritionGoal]
    );

    // Today's nutrition totals from meal plan
    const totals = useMemo(
        () =>
            mealItems.reduce(
                (acc, item) => ({
                    calories: acc.calories + item.calories,
                    protein: acc.protein + item.protein,
                    carbs: acc.carbs + item.carbs,
                    fat: acc.fat + item.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
            ),
        [mealItems]
    );

    // Today's workout
    const todaySession = useMemo(
        () =>
            sessions.find(
                (s) => s.day_of_week === todayDow && !s.is_rest_day && s.week_number === 1
            ),
        [sessions, todayDow]
    );

    // Week 1 active days for streak
    const weekActiveDays = useMemo(
        () =>
            sessions
                .filter((s) => s.week_number === 1 && !s.is_rest_day)
                .map((s) => s.day_of_week),
        [sessions]
    );

    // Checklist items
    const checklistItems = useMemo(() => {
        const items: { key: string; type: "meal" | "workout"; label: string; icon: string; detail: string }[] = [];

        // Meals with food
        MEAL_TYPES.forEach((meal) => {
            const mealFoods = mealItems.filter((i) => i.meal_type === meal);
            if (mealFoods.length > 0) {
                const cals = mealFoods.reduce((s, i) => s + i.calories, 0);
                items.push({
                    key: meal,
                    type: "meal",
                    label: MEAL_LABELS[meal],
                    icon: MEAL_ICONS[meal],
                    detail: `${mealFoods.length} món · ${cals} kcal`,
                });
            }
        });

        // Workout
        if (todaySession) {
            items.push({
                key: WORKOUT_COMPLETION_KEY,
                type: "workout",
                label: todaySession.title,
                icon: "🏋️",
                detail: `${todaySession.exercises.length} bài · ${todaySession.exercises.reduce((s, e) => s + e.sets.length, 0)} set`,
            });
        }

        return items;
    }, [mealItems, todaySession]);

    const completedCount = checklistItems.filter((item) =>
        isCompleted(completions, item.type, item.key)
    ).length;
    const totalGoals = checklistItems.length;
    const progressPercent = totalGoals > 0 ? (completedCount / totalGoals) * 100 : 0;

    // ─── Login prompt ──────────────────────────────────────────────────────────

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin + "/auth/callback" },
        });
    };

    if (!authLoading && !user) {
        return (
            <main
                className={`p-6 min-h-full flex flex-col items-center justify-center gap-8 transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"
                    }`}
                style={{ paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))" }}
            >
                {/* Hero */}
                <div className="text-center">
                    <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-indigo-500/30">
                        <Dumbbell className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">My Fitness</h1>
                    <p className="text-white/50 text-sm max-w-[280px] mx-auto">
                        Theo dõi chế độ tập luyện và dinh dưỡng mỗi ngày
                    </p>
                </div>

                {/* Features */}
                <div className="grid grid-cols-3 gap-3 w-full max-w-sm">
                    {[
                        { icon: "🔥", label: "Calories" },
                        { icon: "🏋️", label: "Lịch tập" },
                        { icon: "🥗", label: "Thực đơn" },
                    ].map((f) => (
                        <div
                            key={f.label}
                            className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5"
                        >
                            <span className="text-2xl">{f.icon}</span>
                            <span className="text-[10px] text-white/40 font-medium">{f.label}</span>
                        </div>
                    ))}
                </div>

                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2.5 px-8 py-4 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-2xl text-white font-semibold active:scale-95 transition-transform shadow-lg shadow-indigo-500/25"
                >
                    <LogIn className="w-5 h-5" />
                    Đăng nhập với Google
                </button>
            </main>
        );
    }

    // ─── Dashboard ──────────────────────────────────────────────────────────────

    return (
        <main
            className={`p-5 min-h-full transition-opacity duration-500 ${mounted ? "opacity-100" : "opacity-0"
                }`}
            style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
            {/* ── Header with avatar ─────────────────────────────────────────────── */}
            <header className="flex items-center justify-between mb-6">
                <div className="flex-1 min-w-0">
                    <p className="text-white/40 text-xs font-medium mb-0.5">
                        {getGreeting()} 👋
                    </p>
                    <h1 className="text-xl font-bold text-white truncate">
                        {user ? getUserDisplayName(user) : "..."}
                    </h1>
                </div>
                {user && getUserAvatar(user) && (
                    <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-indigo-500/30 flex-shrink-0 ml-3">
                        <img
                            src={getUserAvatar(user)!}
                            alt="Avatar"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                        />
                    </div>
                )}
            </header>

            {dataLoading ? (
                <div className="flex items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <>
                    {/* ── Progress Overview Card ──────────────────────────────────── */}
                    <section className="mb-5 p-5 rounded-3xl bg-gradient-to-br from-indigo-500/12 to-purple-500/8 border border-white/5 backdrop-blur-md animate-fade-in-up">
                        <div className="flex items-center gap-5">
                            {/* Progress Ring */}
                            <div className="relative w-[110px] h-[110px] shrink-0">
                                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                                    <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                                    <circle
                                        cx="50" cy="50" r="42" fill="none"
                                        stroke="url(#progressGrad)"
                                        strokeWidth="8"
                                        strokeLinecap="round"
                                        strokeDasharray={`${2 * Math.PI * 42}`}
                                        strokeDashoffset={`${2 * Math.PI * 42 * (1 - progressPercent / 100)}`}
                                        className="transition-all duration-1000"
                                    />
                                    <defs>
                                        <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                                            <stop offset="0%" stopColor="#818cf8" />
                                            <stop offset="100%" stopColor="#34d399" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                                <div className="absolute inset-0 flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-white">{completedCount}</span>
                                    <span className="text-[10px] text-white/40">/ {totalGoals}</span>
                                </div>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-1.5 mb-1">
                                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                                    <span className="text-[10px] text-white/40 font-medium">Tiến độ hôm nay</span>
                                </div>
                                <p className="text-lg font-bold text-white mb-0.5">
                                    {progressPercent === 100 ? "Hoàn thành! 🎉" : `${Math.round(progressPercent)}%`}
                                </p>
                                <p className="text-[10px] text-white/30">
                                    {completedCount === totalGoals && totalGoals > 0
                                        ? "Tuyệt vời! Bạn đã hoàn thành tất cả"
                                        : `Còn ${totalGoals - completedCount} mục tiêu cần hoàn thành`}
                                </p>

                                {/* Nutrition summary */}
                                <div className="mt-3 flex items-center gap-1.5">
                                    <Utensils className="w-3 h-3 text-emerald-400" />
                                    <span className="text-[10px] text-white/40">
                                        {totals.calories.toLocaleString()} / {goal.calories.toLocaleString()} kcal trong thực đơn
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* ── Checklist ──────────────────────────────────────────────────── */}
                    <section className="mb-5 animate-fade-in-up-delay-1">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Check className="w-4 h-4 text-emerald-400" />
                                <h2 className="text-sm font-semibold text-white/80">Mục tiêu hôm nay</h2>
                            </div>
                            <span className="text-[10px] text-white/30">{DAY_FULL_LABELS[todayDow]}</span>
                        </div>

                        {checklistItems.length === 0 ? (
                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 text-center">
                                <p className="text-xs text-white/30">
                                    Chưa có kế hoạch cho hôm nay.<br />
                                    Hãy thiết lập thực đơn và lịch tập.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {checklistItems.map((item) => {
                                    const done = isCompleted(completions, item.type, item.key);
                                    const toggling = togglingKey === item.key;

                                    return (
                                        <button
                                            key={item.key}
                                            onClick={() => handleToggle(item.type, item.key)}
                                            disabled={toggling}
                                            className={`w-full flex items-center p-3.5 rounded-2xl border transition-all active:scale-[0.98] ${
                                                done
                                                    ? "bg-emerald-500/8 border-emerald-500/15"
                                                    : "bg-white/5 border-white/5 active:bg-white/8"
                                            } ${toggling ? "opacity-50" : ""}`}
                                        >
                                            {/* Checkbox */}
                                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center mr-3 shrink-0 transition-all ${
                                                done
                                                    ? "bg-emerald-500/30 border border-emerald-500/50"
                                                    : "bg-white/5 border border-white/10"
                                            }`}>
                                                {done ? (
                                                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                                                ) : (
                                                    <Circle className="w-3 h-3 text-white/20" />
                                                )}
                                            </div>

                                            {/* Icon */}
                                            <span className="text-lg mr-2.5">{item.icon}</span>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className={`text-sm font-medium truncate ${done ? "text-white/50 line-through" : "text-white/90"}`}>
                                                    {item.label}
                                                </p>
                                                <p className="text-[10px] text-white/35 mt-0.5">{item.detail}</p>
                                            </div>

                                            {/* Status */}
                                            {done && (
                                                <span className="text-[10px] text-emerald-400 font-medium ml-2">✓</span>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                    </section>

                    {/* ── Quick Stats Grid ───────────────────────────────────────────── */}
                    <section className="grid grid-cols-2 gap-3 mb-5 animate-fade-in-up-delay-1">
                        {/* Workout today stat */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/15 to-indigo-500/8 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-violet-500/20 flex items-center justify-center">
                                    <Dumbbell className="w-3.5 h-3.5 text-violet-400" />
                                </div>
                                <span className="text-[10px] text-white/40 font-medium">Buổi tập hôm nay</span>
                            </div>
                            {todaySession ? (
                                <>
                                    <p className="text-sm font-bold text-white truncate">{todaySession.title}</p>
                                    <p className="text-[10px] text-white/30 mt-0.5">
                                        {todaySession.exercises.length} bài · {todaySession.exercises.reduce((s, e) => s + e.sets.length, 0)} set
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold text-white/40">Nghỉ ngơi</p>
                                    <p className="text-[10px] text-white/20 mt-0.5">Không có lịch tập</p>
                                </>
                            )}
                        </div>

                        {/* Streak stat */}
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/15 to-orange-500/8 border border-white/5">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
                                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                                </div>
                                <span className="text-[10px] text-white/40 font-medium">Tuần này</span>
                            </div>
                            <p className="text-2xl font-bold text-white">{weekActiveDays.length}</p>
                            <p className="text-[10px] text-white/30 mt-0.5">ngày tập / tuần</p>
                        </div>
                    </section>

                    {/* ── Week Streak ────────────────────────────────────────────────── */}
                    <section className="mb-5 p-4 rounded-2xl bg-white/5 border border-white/5 animate-fade-in-up-delay-2">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-amber-400" />
                                <h2 className="text-sm font-semibold text-white/80">Lịch tập trong tuần</h2>
                            </div>
                            <Link
                                href="/schedule"
                                className="flex items-center gap-0.5 text-[10px] text-indigo-400 font-medium"
                            >
                                Chi tiết
                                <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <WeekStreak activeDays={weekActiveDays} today={todayDow} />
                    </section>

                    {/* ── Today's Workout Preview ────────────────────────────────────── */}
                    {todaySession && todaySession.exercises.length > 0 && (
                        <section className="mb-5">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CalendarDays className="w-4 h-4 text-indigo-400" />
                                    <h2 className="text-sm font-semibold text-white/80">
                                        {DAY_FULL_LABELS[todayDow]} — {todaySession.title}
                                    </h2>
                                </div>
                                <Link
                                    href="/schedule"
                                    className="flex items-center gap-0.5 text-[10px] text-indigo-400 font-medium"
                                >
                                    Xem
                                    <ChevronRight className="w-3 h-3" />
                                </Link>
                            </div>

                            <div className="space-y-2">
                                {todaySession.exercises.slice(0, 4).map((exercise) => (
                                    <div
                                        key={exercise.id}
                                        className="flex items-center p-3 rounded-2xl bg-white/5 border border-white/5 transition-all"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center mr-3 text-lg">
                                            {CATEGORY_ICONS[exercise.category]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-white/90 truncate">
                                                {exercise.name}
                                            </p>
                                            <p className="text-[10px] text-white/35">
                                                {exercise.sets.length} set
                                                {exercise.sets[0]?.weight != null
                                                    ? ` · ${exercise.sets[0].weight}kg`
                                                    : ""}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-bold text-white/60">
                                                {exercise.sets[0]?.reps ?? "—"}
                                            </p>
                                            <p className="text-[9px] text-white/25">reps</p>
                                        </div>
                                    </div>
                                ))}
                                {todaySession.exercises.length > 4 && (
                                    <Link
                                        href="/schedule"
                                        className="block text-center py-2.5 rounded-2xl bg-white/5 border border-white/5 text-xs text-white/30 active:bg-white/10 transition-colors"
                                    >
                                        +{todaySession.exercises.length - 4} bài tập khác
                                    </Link>
                                )}
                            </div>
                        </section>
                    )}

                    {/* ── Quick Actions ──────────────────────────────────────────────── */}
                    <section className="mb-6 animate-fade-in-up-delay-4">
                        <h2 className="text-sm font-semibold text-white/80 mb-3">Truy cập nhanh</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <Link
                                href="/menu"
                                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-emerald-500/12 to-teal-500/8 border border-white/5 active:scale-[0.98] transition-transform"
                            >
                                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                                    <Utensils className="w-5 h-5 text-emerald-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/90">Thực đơn</p>
                                    <p className="text-[10px] text-white/30">Thiết lập bữa ăn</p>
                                </div>
                            </Link>

                            <Link
                                href="/schedule"
                                className="flex items-center gap-3 p-4 rounded-2xl bg-gradient-to-br from-violet-500/12 to-indigo-500/8 border border-white/5 active:scale-[0.98] transition-transform"
                            >
                                <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center">
                                    <CalendarDays className="w-5 h-5 text-violet-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-white/90">Lịch tập</p>
                                    <p className="text-[10px] text-white/30">Xem lịch tuần</p>
                                </div>
                            </Link>
                        </div>
                    </section>

                    {/* ── Motivational footer ────────────────────────────────────────── */}
                    <div className="flex items-center justify-center gap-2 py-4">
                        <TrendingUp className="w-3.5 h-3.5 text-indigo-400/40" />
                        <p className="text-[11px] text-white/20 italic">
                            Mỗi ngày tốt hơn một chút 💪
                        </p>
                    </div>
                </>
            )}
        </main>
    );
}
