"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Plus, Trash2, LogIn, Check, Utensils } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMealPlanByDay, addMealPlanItem, deleteMealPlanItem } from "@/lib/meal-plans";
import { getCompletionsByDate, toggleCompletion } from "@/lib/completions";
import { getNutritionGoal } from "@/lib/nutrition-goals";
import {
    MealPlanItem,
    MealPlanItemInsert,
    MealType,
    MEAL_TYPES,
    MEAL_LABELS,
    MEAL_ICONS,
    MEAL_COLORS,
} from "@/types/meal-plan";
import { DEFAULT_NUTRITION_GOAL } from "@/types/nutrition-goal";
import type { NutritionGoalUpsert } from "@/types/nutrition-goal";
import { DailyCompletion, isCompleted } from "@/types/completion";
import { DayOfWeek, DAY_FULL_LABELS } from "@/types/schedule";
import AddFoodModal from "@/components/AddFoodModal";
import MacroRing from "@/components/MacroRing";
import DaySelector from "@/components/DaySelector";
import { User } from "@supabase/supabase-js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentDayOfWeek(): DayOfWeek {
    return new Date().getDay() as DayOfWeek;
}

function toDateString(date: Date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

// ─── Main ────────────────────────────────────────────────────────────────────

export default function MenuPage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDayOfWeek());
    const [items, setItems] = useState<MealPlanItem[]>([]);
    const [completions, setCompletions] = useState<DailyCompletion[]>([]);
    const [nutritionGoal, setNutritionGoal] = useState<NutritionGoalUpsert>(
        DEFAULT_NUTRITION_GOAL
    );
    const [dataLoading, setDataLoading] = useState(false);
    const [activeModal, setActiveModal] = useState<MealType | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [togglingKey, setTogglingKey] = useState<string | null>(null);

    const todayDow = getCurrentDayOfWeek();
    const today = toDateString(new Date());
    const isToday = selectedDay === todayDow;

    // Auth
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setAuthLoading(false);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
            setUser(s?.user ?? null);
        });
        return () => subscription.unsubscribe();
    }, []);

    // Load data
    const loadData = useCallback(async () => {
        if (!user) return;
        setDataLoading(true);
        try {
            const [planItems, todayCompletions, savedNutritionGoal] = await Promise.all([
                getMealPlanByDay(selectedDay),
                isToday ? getCompletionsByDate(today) : Promise.resolve([]),
                getNutritionGoal(),
            ]);
            setItems(planItems);
            setCompletions(todayCompletions);
            setNutritionGoal(savedNutritionGoal);
        } catch (e) {
            console.error("Menu load error:", e);
        } finally {
            setDataLoading(false);
        }
    }, [user, selectedDay, isToday, today]);

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            loadData();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [loadData]);

    // ─── Actions ──────────────────────────────────────────────────────────────

    const handleAdd = async (item: MealPlanItemInsert) => {
        const newItem = await addMealPlanItem(item);
        setItems((prev) => [...prev, newItem]);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteMealPlanItem(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleCompletion = async (mealType: MealType) => {
        if (!isToday) return;
        const key = mealType;
        const completed = isCompleted(completions, "meal", key);
        setTogglingKey(key);
        try {
            const result = await toggleCompletion(today, "meal", key, completed);
            if (result) {
                setCompletions((prev) => [...prev, result]);
            } else {
                setCompletions((prev) =>
                    prev.filter((c) => !(c.type === "meal" && c.reference_key === key))
                );
            }
        } finally {
            setTogglingKey(null);
        }
    };

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin + "/auth/callback" },
        });
    };

    // ─── Derived ──────────────────────────────────────────────────────────────

    const totals = useMemo(
        () =>
            items.reduce(
                (acc, item) => ({
                    calories: acc.calories + item.calories,
                    protein: acc.protein + item.protein,
                    carbs: acc.carbs + item.carbs,
                    fat: acc.fat + item.fat,
                }),
                { calories: 0, protein: 0, carbs: 0, fat: 0 }
            ),
        [items]
    );

    const goal = useMemo(
        () => ({
            calories: Math.max(1, nutritionGoal.calories),
            protein: Math.max(1, nutritionGoal.protein_g),
            carbs: Math.max(1, nutritionGoal.carbs_g),
            fat: Math.max(1, nutritionGoal.fat_g),
        }),
        [nutritionGoal]
    );
    const calPercent = goal.calories > 0 ? Math.min((totals.calories / goal.calories) * 100, 100) : 0;
    const completedMeals = MEAL_TYPES.filter((m) =>
        isCompleted(completions, "meal", m)
    ).length;
    const totalMealsWithFood = MEAL_TYPES.filter((m) =>
        items.some((i) => i.meal_type === m)
    ).length;

    // ─── Not logged in ────────────────────────────────────────────────────────

    if (!authLoading && !user) {
        return (
            <main className="p-6 min-h-full flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <p className="text-5xl mb-4">🥗</p>
                    <h2 className="text-xl font-bold text-white/90 mb-2">Thực đơn</h2>
                    <p className="text-sm text-white/50">Đăng nhập để thiết lập thực đơn hàng tuần</p>
                </div>
                <button
                    onClick={handleLogin}
                    className="flex items-center gap-2 px-6 py-3.5 bg-white rounded-2xl text-slate-900 font-semibold active:scale-95 transition-transform"
                >
                    <LogIn className="w-5 h-5" />
                    Đăng nhập với Google
                </button>
            </main>
        );
    }

    // ─── Main UI ──────────────────────────────────────────────────────────────

    return (
        <main
            className="p-5 min-h-full"
            style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
            <header className="mb-5">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Thực đơn
                </h1>
                <p className="text-xs text-white/40 mt-1">
                    Thiết lập thực đơn cố định cho mỗi ngày trong tuần
                </p>
            </header>

            {/* ── Day of Week Selector ──────────────────────────────────────────── */}
            <div className="mb-5">
                <DaySelector selectedDay={selectedDay} onSelectDay={setSelectedDay} />
            </div>

            {/* ── Today's completion progress (only show for today) ────────────── */}
            {isToday && totalMealsWithFood > 0 && (
                <div className="mb-5 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/12 to-teal-500/8 border border-emerald-500/15">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="text-xs font-medium text-white/70">Tiến độ hôm nay</p>
                                <p className="text-sm font-bold text-white">
                                    {completedMeals}/{totalMealsWithFood} bữa hoàn thành
                                </p>
                            </div>
                        </div>
                        {completedMeals === totalMealsWithFood && totalMealsWithFood > 0 && (
                            <span className="text-lg">🎉</span>
                        )}
                    </div>
                    {/* Progress bar */}
                    <div className="mt-2.5 h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-700"
                            style={{
                                width: `${totalMealsWithFood > 0 ? (completedMeals / totalMealsWithFood) * 100 : 0}%`,
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ── Daily Summary ─────────────────────────────────────────────────── */}
            <div className="mb-5 p-4 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <p className="text-xs text-white/40 mb-0.5">{DAY_FULL_LABELS[selectedDay]}</p>
                        <p className="text-2xl font-bold text-white">
                            {totals.calories.toLocaleString()}
                            <span className="text-sm font-normal text-white/40 ml-1">kcal</span>
                        </p>
                    </div>
                    <p className="text-sm text-white/40">
                        Mục tiêu{" "}
                        <span className="font-semibold text-white/60">{goal.calories.toLocaleString()}</span>{" "}
                        kcal
                    </p>
                </div>
                <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-4">
                    <div
                        className={`h-full rounded-full transition-all duration-700 ${
                            calPercent >= 100 ? "bg-red-400" : "bg-gradient-to-r from-indigo-400 to-cyan-400"
                        }`}
                        style={{ width: `${calPercent}%` }}
                    />
                </div>
                <div className="flex justify-around">
                    <MacroRing label="Đạm" value={totals.protein} max={goal.protein} color="#818cf8" />
                    <MacroRing label="Tinh bột" value={totals.carbs} max={goal.carbs} color="#22d3ee" />
                    <MacroRing label="Béo" value={totals.fat} max={goal.fat} color="#fb923c" />
                </div>
            </div>

            {/* ── Meal Sections ─────────────────────────────────────────────────── */}
            {dataLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {MEAL_TYPES.map((meal) => {
                        const mealItems = items.filter((i) => i.meal_type === meal);
                        const mealCals = mealItems.reduce((s, i) => s + i.calories, 0);
                        const completed = isToday && isCompleted(completions, "meal", meal);
                        const hasFood = mealItems.length > 0;

                        return (
                            <section key={meal}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">{MEAL_ICONS[meal]}</span>
                                        <h3 className="text-sm font-semibold text-white/80">{MEAL_LABELS[meal]}</h3>
                                        {mealCals > 0 && (
                                            <span className="text-xs text-amber-400 font-medium">{mealCals} kcal</span>
                                        )}
                                        {completed && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 font-medium">
                                                ✓ Xong
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {/* Complete button (only for today & has food) */}
                                        {isToday && hasFood && (
                                            <button
                                                onClick={() => handleToggleCompletion(meal)}
                                                disabled={togglingKey === meal}
                                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all ${
                                                    completed
                                                        ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400"
                                                        : "bg-white/5 border border-white/10 text-white/50 active:bg-emerald-500/10"
                                                } ${togglingKey === meal ? "opacity-50" : ""}`}
                                            >
                                                <Check className="w-3 h-3" />
                                                {completed ? "Hoàn thành" : "Đánh dấu"}
                                            </button>
                                        )}
                                        {/* Add food button */}
                                        <button
                                            onClick={() => setActiveModal(meal)}
                                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-xs font-medium active:bg-indigo-500/25 transition-colors"
                                        >
                                            <Plus className="w-3 h-3" />
                                            Thêm
                                        </button>
                                    </div>
                                </div>

                                {mealItems.length === 0 ? (
                                    <div className={`p-3 rounded-2xl bg-gradient-to-br ${MEAL_COLORS[meal]} border border-white/5`}>
                                        <p className="text-xs text-white/30 text-center py-2">Chưa có món ăn nào</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {mealItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className={`flex items-center p-3 rounded-2xl bg-gradient-to-br ${MEAL_COLORS[meal]} border border-white/5 ${
                                                    completed ? "opacity-60" : ""
                                                }`}
                                            >
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium text-white/90 truncate ${completed ? "line-through" : ""}`}>
                                                        {item.name}
                                                    </p>
                                                    <p className="text-xs text-white/40 mt-0.5">
                                                        {item.quantity} {item.unit} · P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-3 ml-3">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-amber-400">{item.calories}</p>
                                                        <p className="text-[10px] text-white/30">kcal</p>
                                                    </div>
                                                    <button
                                                        onClick={() => handleDelete(item.id)}
                                                        disabled={deletingId === item.id}
                                                        className="p-1.5 rounded-lg bg-red-500/10 active:bg-red-500/20 transition-colors disabled:opacity-40"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </section>
                        );
                    })}
                </div>
            )}

            {/* ── Empty state ──────────────────────────────────────────────────── */}
            {!dataLoading && items.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-3">
                    <Utensils className="w-10 h-10 text-white/10" />
                    <p className="text-xs text-white/30 text-center">
                        Chưa có thực đơn cho {DAY_FULL_LABELS[selectedDay]}.<br />
                        Nhấn &quot;Thêm&quot; để bắt đầu thiết lập.
                    </p>
                </div>
            )}

            {/* ── Add Food Modal ───────────────────────────────────────────────── */}
            {activeModal && (
                <AddFoodModal
                    defaultMealType={activeModal}
                    dayOfWeek={selectedDay}
                    onAdd={handleAdd}
                    onClose={() => setActiveModal(null)}
                />
            )}
        </main>
    );
}
