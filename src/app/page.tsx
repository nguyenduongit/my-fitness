"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Dumbbell,
    TrendingUp,
    LogIn,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMealPlanByDay } from "@/lib/meal-plans";
import { getCompletionsByDate } from "@/lib/completions";
import { getNutritionGoal } from "@/lib/nutrition-goals";
import {
    MealPlanItem,
} from "@/types/meal-plan";
import { DEFAULT_NUTRITION_GOAL } from "@/types/nutrition-goal";
import type { NutritionGoalUpsert } from "@/types/nutrition-goal";
import {
    DayOfWeek,
} from "@/types/schedule";
import NutritionSummary from "@/components/NutritionSummary";
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
    const [nutritionGoal, setNutritionGoal] = useState<NutritionGoalUpsert>(
        DEFAULT_NUTRITION_GOAL
    );
    const [dataLoading, setDataLoading] = useState(false);

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
            const [meals, savedNutritionGoal] = await Promise.all([
                getMealPlanByDay(todayDow),
                getNutritionGoal(),
            ]);
            setMealItems(meals);
            setNutritionGoal(savedNutritionGoal);
        } catch (e) {
            console.error("Dashboard data load error:", e);
        } finally {
            setDataLoading(false);
        }
    }, [user, todayDow]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadData();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadData]);

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
                    {/* ── Nutrition Summary Block (Moved from Menu) ────────────────── */}
                    <NutritionSummary 
                        totals={totals}
                        goal={goal}
                        className="mb-6 animate-fade-in-up"
                    />

                    {/* Placeholder for future blocks */}
                    <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-3xl animate-pulse">
                        <p className="text-sm text-white/20 italic">Dashboard đang được xây dựng lại...</p>
                    </div>

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
