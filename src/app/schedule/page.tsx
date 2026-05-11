"use client";

import { useEffect, useState, useCallback } from "react";
import { LogIn, CalendarDays, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
    getWorkoutSessions,
    createWorkoutSession,
    updateWorkoutSession,
} from "@/lib/schedule";
import { getCompletionsByDate, toggleCompletion } from "@/lib/completions";
import {
    WorkoutSession,
    DayOfWeek,
    DAY_FULL_LABELS,
    Exercise,
} from "@/types/schedule";
import { DailyCompletion, isCompleted, WORKOUT_COMPLETION_KEY } from "@/types/completion";
import WorkoutCard from "@/components/WorkoutCard";
import ExerciseFormModal from "@/components/ExerciseFormModal";
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

export default function SchedulePage() {
    const [user, setUser] = useState<User | null>(null);
    const [authLoading, setAuthLoading] = useState(true);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [completions, setCompletions] = useState<DailyCompletion[]>([]);
    const [dataLoading, setDataLoading] = useState(false);
    const [togglingWorkout, setTogglingWorkout] = useState(false);

    const activeWeek = 1;
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(getCurrentDayOfWeek());
    
    // Modal state for Exercise
    const [showModal, setShowModal] = useState(false);
    const [editingExercise, setEditingExercise] = useState<Exercise | undefined>();

    const todayDow = getCurrentDayOfWeek();
    const today = toDateString(new Date());

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

    // Load sessions + today's completions
    const loadData = useCallback(async () => {
        if (!user) return;
        setDataLoading(true);
        try {
            const [sessionsData, completionsData] = await Promise.all([
                getWorkoutSessions(),
                getCompletionsByDate(today),
            ]);
            setSessions(sessionsData);
            setCompletions(completionsData);
        } finally {
            setDataLoading(false);
        }
    }, [user, today]);

    useEffect(() => { loadData(); }, [loadData]);

    // ─── Actions ────────────────────────────────────────────────────────────────

    const handleSaveExercise = async (exercise: Exercise) => {
        const session = sessions.find((s) => s.day_of_week === selectedDay);
        if (session) {
            // Update session
            const exists = session.exercises.find((e) => e.id === exercise.id);
            const newExercises = exists
                ? session.exercises.map((e) => (e.id === exercise.id ? exercise : e))
                : [...session.exercises, exercise];
            
            const updated = await updateWorkoutSession(session.id, {
                exercises: newExercises,
                is_rest_day: false,
            });
            setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        } else {
            // Create session
            const created = await createWorkoutSession({
                day_of_week: selectedDay,
                week_number: activeWeek,
                title: `Buổi tập ${DAY_FULL_LABELS[selectedDay]}`,
                exercises: [exercise],
                is_rest_day: false,
            });
            setSessions((prev) => [...prev, created]);
        }
    };

    const handleDeleteExercise = async (exerciseId: string) => {
        const session = sessions.find((s) => s.day_of_week === selectedDay);
        if (!session) return;
        const newExercises = session.exercises.filter((e) => e.id !== exerciseId);
        const updated = await updateWorkoutSession(session.id, { exercises: newExercises });
        setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    };

    const handleToggleRestDay = async () => {
        const session = sessions.find((s) => s.day_of_week === selectedDay);
        if (session) {
            const updated = await updateWorkoutSession(session.id, { is_rest_day: !session.is_rest_day });
            setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        } else {
            const created = await createWorkoutSession({
                day_of_week: selectedDay,
                week_number: activeWeek,
                title: "Nghỉ ngơi",
                exercises: [],
                is_rest_day: true,
            });
            setSessions((prev) => [...prev, created]);
        }
    };

    const handleToggleWorkoutComplete = async () => {
        const completed = isCompleted(completions, "workout", WORKOUT_COMPLETION_KEY);
        setTogglingWorkout(true);
        try {
            const result = await toggleCompletion(today, "workout", WORKOUT_COMPLETION_KEY, completed);
            if (result) {
                setCompletions((prev) => [...prev, result]);
            } else {
                setCompletions((prev) =>
                    prev.filter((c) => !(c.type === "workout" && c.reference_key === WORKOUT_COMPLETION_KEY))
                );
            }
        } finally {
            setTogglingWorkout(false);
        }
    };

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: { redirectTo: window.location.origin + "/auth/callback" },
        });
    };

    // ─── Derived ─────────────────────────────────────────────────────────────────

    const weekSessions = sessions.filter((s) => s.week_number === activeWeek);

    // Weekly stats
    const workoutDays = weekSessions.filter((s) => !s.is_rest_day).length;
    const totalExercises = weekSessions.reduce((s, ws) => s + ws.exercises.length, 0);
    const totalSets = weekSessions.reduce(
        (s, ws) => s + ws.exercises.reduce((es, e) => es + e.sets.length, 0),
        0
    );

    // Today's workout completion status
    const workoutCompleted = isCompleted(completions, "workout", WORKOUT_COMPLETION_KEY);
    const todaySession = weekSessions.find(
        (s) => s.day_of_week === todayDow && !s.is_rest_day
    );

    // ─── Not logged in ───────────────────────────────────────────────────────────

    if (!authLoading && !user) {
        return (
            <main className="p-6 min-h-full flex flex-col items-center justify-center gap-6">
                <div className="text-center">
                    <p className="text-5xl mb-4">🏋️</p>
                    <h2 className="text-xl font-bold text-white/90 mb-2">Lịch tập luyện</h2>
                    <p className="text-sm text-white/50">Đăng nhập để tạo và theo dõi lịch tập của bạn</p>
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
            {/* Day of Week Selector */}
            <div className="mb-5">
                <DaySelector selectedDay={selectedDay} onSelectDay={setSelectedDay} />
            </div>


            {/* Session list */}
            {dataLoading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (() => {
                const session = sessions.find((s) => s.day_of_week === selectedDay);
                if (!session) {
                    return (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <CalendarDays className="w-12 h-12 text-white/10" />
                            <p className="text-white/30 text-sm text-center">
                                Chưa có lịch tập cho ngày này.
                            </p>
                            <div className="flex gap-2 mt-2">
                                <button
                                    onClick={() => { setEditingExercise(undefined); setShowModal(true); }}
                                    className="px-5 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-sm font-medium active:bg-indigo-500/25 transition-colors"
                                >
                                    Thêm bài tập
                                </button>
                            </div>
                        </div>
                    );
                }

                const isTodaySession = session.day_of_week === todayDow && session.week_number === activeWeek;
                return (
                    <WorkoutCard
                        key={session.id}
                        session={session}
                        isToday={isTodaySession}
                        isCompleted={isTodaySession && workoutCompleted}
                        isToggling={togglingWorkout}
                        onEditExercise={(ex) => { setEditingExercise(ex); setShowModal(true); }}
                        onDeleteExercise={handleDeleteExercise}
                        onAddExercise={() => { setEditingExercise(undefined); setShowModal(true); }}
                        onToggleComplete={isTodaySession ? handleToggleWorkoutComplete : undefined}
                        onToggleRestDay={handleToggleRestDay}
                    />
                );
            })()}

            {/* Form modal */}
            {showModal && (
                <ExerciseFormModal
                    exercise={editingExercise}
                    onSave={handleSaveExercise}
                    onClose={() => { setShowModal(false); setEditingExercise(undefined); }}
                />
            )}
        </main>
    );
}