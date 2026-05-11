"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { LogIn, Utensils } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getMealPlanByDay, addMealPlanItem, deleteMealPlanItem, updateMealPlanItem } from "@/lib/meal-plans";
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
import DaySelector from "@/components/DaySelector";
import MealBlock from "@/components/MealBlock";
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
    const [editingItem, setEditingItem] = useState<MealPlanItem | null>(null);
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

    const handleUpdate = async (id: string, updates: Partial<MealPlanItemInsert>) => {
        const updated = await updateMealPlanItem(id, updates);
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
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

    // Derived data for summary was removed from here

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


            {/* ── Meal Sections ─────────────────────────────────────────────────── */}
            {dataLoading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-4">
                    {MEAL_TYPES.map((meal) => {
                        const mealItems = items.filter((i) => i.meal_type === meal);
                        const completed = isToday && isCompleted(completions, "meal", meal);

                        return (
                            <MealBlock
                                key={meal}
                                mealType={meal}
                                items={mealItems}
                                isToday={isToday}
                                isCompleted={completed}
                                isToggling={togglingKey === meal}
                                deletingId={deletingId}
                                onToggleCompletion={handleToggleCompletion}
                                onAddFood={setActiveModal}
                                onDeleteFood={handleDelete}
                                onEditFood={setEditingItem}
                            />
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

            {/* ── Add/Edit Food Modal ───────────────────────────────────────────── */}
            {(activeModal || editingItem) && (
                <AddFoodModal
                    defaultMealType={activeModal || editingItem?.meal_type || "breakfast"}
                    dayOfWeek={selectedDay}
                    onAdd={handleAdd}
                    onUpdate={handleUpdate}
                    onClose={() => {
                        setActiveModal(null);
                        setEditingItem(null);
                    }}
                    editItem={editingItem}
                />
            )}
        </main>
    );
}
