"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  Flame,
  Dumbbell,
  TrendingUp,
  ChevronRight,
  LogIn,
  Utensils,
  CalendarDays,
  Zap,
  Target,
  Trophy,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { getFoodItems } from "@/lib/menu";
import { getWorkoutSessions } from "@/lib/schedule";
import { FoodItem, DEFAULT_DAILY_GOAL, MEAL_LABELS, MealType } from "@/types/menu";
import {
  WorkoutSession,
  DayOfWeek,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  DAY_FULL_LABELS,
} from "@/types/schedule";
import CalorieRing from "@/components/CalorieRing";
import WeekStreak from "@/components/WeekStreak";
import Link from "next/link";
import { User } from "@supabase/supabase-js";

// ─── Helpers ────────────────────────────────────────────────────────────────

function toDateString(date: Date) {
  return date.toISOString().split("T")[0];
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

  const [foodItems, setFoodItems] = useState<FoodItem[]>([]);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const todayDow = getCurrentDayOfWeek();
  const today = toDateString(new Date());

  // Auth
  useEffect(() => {
    setMounted(true);
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const [food, workouts] = await Promise.all([
        getFoodItems(today),
        getWorkoutSessions(),
      ]);
      setFoodItems(food);
      setSessions(workouts);
    } catch (e) {
      console.error("Dashboard data load error:", e);
    } finally {
      setDataLoading(false);
    }
  }, [user, today]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ─── Derived data ───────────────────────────────────────────────────────────

  const goal = DEFAULT_DAILY_GOAL;

  const totals = useMemo(
    () =>
      foodItems.reduce(
        (acc, item) => ({
          calories: acc.calories + item.calories,
          protein: acc.protein + item.protein,
          carbs: acc.carbs + item.carbs,
          fat: acc.fat + item.fat,
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      ),
    [foodItems]
  );

  // Today's workout
  const todaySession = useMemo(
    () =>
      sessions.find(
        (s) => s.day_of_week === todayDow && !s.is_rest_day
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

  // Total exercises today
  const todayExerciseCount = todaySession?.exercises.length ?? 0;
  const todaySetCount =
    todaySession?.exercises.reduce((s, e) => s + e.sets.length, 0) ?? 0;

  // Meals eaten today
  const mealsEaten = useMemo(() => {
    const types = new Set(foodItems.map((i) => i.meal_type));
    return types.size;
  }, [foodItems]);

  // Macro percentages
  const proteinPercent = goal.protein > 0 ? Math.min((totals.protein / goal.protein) * 100, 100) : 0;
  const carbsPercent = goal.carbs > 0 ? Math.min((totals.carbs / goal.carbs) * 100, 100) : 0;
  const fatPercent = goal.fat > 0 ? Math.min((totals.fat / goal.fat) * 100, 100) : 0;

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
          {/* ── Calorie Overview Card ──────────────────────────────────────── */}
          <section className="mb-5 p-5 rounded-3xl bg-gradient-to-br from-indigo-500/12 to-purple-500/8 border border-white/5 backdrop-blur-md animate-fade-in-up">
            <div className="flex items-center gap-5">
              <CalorieRing consumed={totals.calories} goal={goal.calories} size={130} />

              <div className="flex-1 space-y-3">
                {/* Consumed */}
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Flame className="w-3.5 h-3.5 text-orange-400" />
                    <span className="text-[10px] text-white/40 font-medium">Đã nạp</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {totals.calories.toLocaleString()}
                    <span className="text-xs font-normal text-white/30 ml-1">kcal</span>
                  </p>
                </div>

                {/* Goal */}
                <div>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <Target className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] text-white/40 font-medium">Mục tiêu</span>
                  </div>
                  <p className="text-lg font-bold text-white/60">
                    {goal.calories.toLocaleString()}
                    <span className="text-xs font-normal text-white/20 ml-1">kcal</span>
                  </p>
                </div>

                {/* Meals */}
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] text-white/40">
                    {mealsEaten}/4 bữa ăn hôm nay
                  </span>
                </div>
              </div>
            </div>

            {/* Macro bars */}
            <div className="mt-5 grid grid-cols-3 gap-3">
              {[
                { label: "Đạm", value: totals.protein, max: goal.protein, percent: proteinPercent, color: "from-indigo-400 to-indigo-500", bg: "bg-indigo-500/10" },
                { label: "Tinh bột", value: totals.carbs, max: goal.carbs, percent: carbsPercent, color: "from-cyan-400 to-cyan-500", bg: "bg-cyan-500/10" },
                { label: "Béo", value: totals.fat, max: goal.fat, percent: fatPercent, color: "from-orange-400 to-orange-500", bg: "bg-orange-500/10" },
              ].map((macro) => (
                <div key={macro.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-white/40 font-medium">{macro.label}</span>
                    <span className="text-[10px] text-white/60 font-semibold">
                      {Math.round(macro.value)}/{macro.max}g
                    </span>
                  </div>
                  <div className={`h-1.5 rounded-full ${macro.bg} overflow-hidden`}>
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${macro.color} transition-all duration-700`}
                      style={{ width: `${macro.percent}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
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
                    {todayExerciseCount} bài · {todaySetCount} set
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
                {todaySession.exercises.slice(0, 4).map((exercise, i) => (
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
                        {CATEGORY_LABELS[exercise.category]} · {exercise.sets.length} set
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

          {/* ── Today's Meals Summary ──────────────────────────────────────── */}
          {foodItems.length > 0 && (
            <section className="mb-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white/80">Bữa ăn hôm nay</h2>
                </div>
                <Link
                  href="/menu"
                  className="flex items-center gap-0.5 text-[10px] text-indigo-400 font-medium"
                >
                  Chi tiết
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((meal) => {
                  const mealItems = foodItems.filter((i) => i.meal_type === meal);
                  const mealCals = mealItems.reduce((s, i) => s + i.calories, 0);
                  if (mealItems.length === 0) return null;

                  return (
                    <div
                      key={meal}
                      className="p-3 rounded-2xl bg-white/5 border border-white/5"
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-sm">
                          {meal === "breakfast"
                            ? "🌅"
                            : meal === "lunch"
                              ? "☀️"
                              : meal === "dinner"
                                ? "🌙"
                                : "🍎"}
                        </span>
                        <span className="text-xs font-medium text-white/70">
                          {MEAL_LABELS[meal]}
                        </span>
                      </div>
                      <p className="text-lg font-bold text-white">
                        {mealCals}
                        <span className="text-[10px] font-normal text-white/30 ml-1">kcal</span>
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">
                        {mealItems.length} món
                      </p>
                    </div>
                  );
                })}
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
                  <p className="text-[10px] text-white/30">Ghi lại bữa ăn</p>
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
