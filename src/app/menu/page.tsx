"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, ChevronLeft, ChevronRight, LogIn } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFoodItems, addFoodItem, deleteFoodItem } from "@/lib/menu";
import {
  FoodItem,
  MealType,
  MEAL_LABELS,
  MEAL_ICONS,
  MEAL_COLORS,
  DEFAULT_DAILY_GOAL,
  FoodItemInsert,
} from "@/types/menu";
import AddFoodModal from "@/components/AddFoodModal";
import MacroRing from "@/components/MacroRing";
import { User } from "@supabase/supabase-js";

function toDateString(date: Date) {
  return date.toISOString().split("T")[0];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  const today = toDateString(new Date());
  const yesterday = toDateString(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Hôm nay";
  if (dateStr === yesterday) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { weekday: "short", day: "numeric", month: "numeric" });
}

export default function MenuPage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [date, setDate] = useState(toDateString(new Date()));
  const [items, setItems] = useState<FoodItem[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [activeModal, setActiveModal] = useState<MealType | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const loadItems = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const data = await getFoodItems(date);
      setItems(data);
    } catch (e) {
      console.error(e);
    } finally {
      setDataLoading(false);
    }
  }, [user, date]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAdd = async (item: FoodItemInsert) => {
    const newItem = await addFoodItem(item);
    setItems((prev) => [...prev, newItem]);
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteFoodItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
    } finally {
      setDeletingId(null);
    }
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
  };

  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein: acc.protein + item.protein,
      carbs: acc.carbs + item.carbs,
      fat: acc.fat + item.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const goal = DEFAULT_DAILY_GOAL;
  const calPercent = Math.min((totals.calories / goal.calories) * 100, 100);
  const mealTypes: MealType[] = ["breakfast", "lunch", "dinner", "snack"];

  if (!authLoading && !user) {
    return (
      <main className="p-6 min-h-full flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🥗</p>
          <h2 className="text-xl font-bold text-white/90 mb-2">Theo dõi thực đơn</h2>
          <p className="text-sm text-white/50">Đăng nhập để lưu và theo dõi chế độ ăn uống của bạn</p>
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

  return (
    <main
      className="p-5 min-h-full"
      style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
    >
      <header className="mb-5">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Thực đơn
        </h1>
      </header>

      {/* Date navigator */}
      <div className="flex items-center justify-between mb-5 p-3 rounded-2xl bg-white/5 border border-white/5">
        <button
          onClick={() => {
            const d = new Date(date + "T00:00:00");
            d.setDate(d.getDate() - 1);
            setDate(toDateString(d));
          }}
          className="p-2 rounded-xl bg-white/5 active:bg-white/15 transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <p className="text-sm font-semibold text-white/90">{formatDate(date)}</p>
        <button
          onClick={() => {
            const d = new Date(date + "T00:00:00");
            d.setDate(d.getDate() + 1);
            const tomorrow = toDateString(d);
            if (tomorrow <= toDateString(new Date())) setDate(tomorrow);
          }}
          className={`p-2 rounded-xl bg-white/5 transition-colors ${date >= toDateString(new Date()) ? "opacity-30" : "active:bg-white/15"
            }`}
          disabled={date >= toDateString(new Date())}
        >
          <ChevronRight className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Daily summary */}
      <div className="mb-5 p-4 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-white/5">
        <div className="mb-4">
          <div className="flex items-end justify-between mb-2">
            <div>
              <p className="text-xs text-white/50 mb-0.5">Tổng calories</p>
              <p className="text-3xl font-bold text-white">
                {totals.calories.toLocaleString()}
                <span className="text-sm font-normal text-white/40 ml-1">kcal</span>
              </p>
            </div>
            <p className="text-sm text-white/40">
              Còn lại{" "}
              <span className={`font-semibold ${totals.calories > goal.calories ? "text-red-400" : "text-emerald-400"}`}>
                {Math.abs(goal.calories - totals.calories).toLocaleString()}
              </span>{" "}
              kcal
            </p>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-700 ${calPercent >= 100 ? "bg-red-400" : "bg-gradient-to-r from-indigo-400 to-cyan-400"
                }`}
              style={{ width: `${calPercent}%` }}
            />
          </div>
          <p className="text-right text-xs text-white/30 mt-1">Mục tiêu: {goal.calories.toLocaleString()} kcal</p>
        </div>
        <div className="flex justify-around">
          <MacroRing label="Đạm" value={totals.protein} max={goal.protein} color="#818cf8" />
          <MacroRing label="Tinh bột" value={totals.carbs} max={goal.carbs} color="#22d3ee" />
          <MacroRing label="Béo" value={totals.fat} max={goal.fat} color="#fb923c" />
        </div>
      </div>

      {/* Meal sections */}
      {dataLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-4">
          {mealTypes.map((meal) => {
            const mealItems = items.filter((i) => i.meal_type === meal);
            const mealCals = mealItems.reduce((s, i) => s + i.calories, 0);
            return (
              <section key={meal}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{MEAL_ICONS[meal]}</span>
                    <h3 className="text-sm font-semibold text-white/80">{MEAL_LABELS[meal]}</h3>
                    {mealCals > 0 && (
                      <span className="text-xs text-amber-400 font-medium">{mealCals} kcal</span>
                    )}
                  </div>
                  <button
                    onClick={() => setActiveModal(meal)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 text-xs font-medium active:bg-indigo-500/25 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Thêm
                  </button>
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
                        className={`flex items-center p-3 rounded-2xl bg-gradient-to-br ${MEAL_COLORS[meal]} border border-white/5`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white/90 truncate">{item.name}</p>
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

      {activeModal && (
        <AddFoodModal
          defaultMealType={activeModal}
          date={date}
          onAdd={handleAdd}
          onClose={() => setActiveModal(null)}
        />
      )}
    </main>
  );
}