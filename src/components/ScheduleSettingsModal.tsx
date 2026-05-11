"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import {
    getWorkoutSessions,
    createWorkoutSession,
    updateWorkoutSession,
} from "@/lib/schedule";
import { WorkoutSession, DayOfWeek, DAY_FULL_LABELS } from "@/types/schedule";

interface ScheduleSettingsModalProps {
    onClose: () => void;
}

const DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

export default function ScheduleSettingsModal({ onClose }: ScheduleSettingsModalProps) {
    const [loading, setLoading] = useState(true);
    const [sessions, setSessions] = useState<WorkoutSession[]>([]);
    const [togglingDay, setTogglingDay] = useState<DayOfWeek | null>(null);

    useEffect(() => {
        getWorkoutSessions().then((data) => {
            setSessions(data.filter((s) => s.week_number === 1));
            setLoading(false);
        });
    }, []);

    const handleToggleDay = async (day: DayOfWeek) => {
        setTogglingDay(day);
        try {
            const existingSession = sessions.find((s) => s.day_of_week === day);
            const isCurrentlyRest = existingSession ? existingSession.is_rest_day : true; // default to rest if not exist

            if (existingSession) {
                // Update
                const updated = await updateWorkoutSession(existingSession.id, {
                    is_rest_day: !isCurrentlyRest,
                });
                setSessions((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
            } else {
                // Create new (set is_rest_day to false since it defaults to true if empty)
                const created = await createWorkoutSession({
                    day_of_week: day,
                    week_number: 1,
                    title: `Buổi tập ${DAY_FULL_LABELS[day]}`,
                    exercises: [],
                    is_rest_day: false,
                });
                setSessions((prev) => [...prev, created]);
            }
        } finally {
            setTogglingDay(null);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-5">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-sm bg-slate-900 rounded-3xl border border-white/10 shadow-2xl flex flex-col p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <h2 className="text-lg font-bold text-white">Tuỳ chỉnh lịch tập</h2>
                        <p className="text-xs text-white/40 mt-0.5">Đánh dấu ngày tập và ngày nghỉ</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors shrink-0"
                    >
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>

                {/* Content */}
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <div className="flex justify-between items-center w-full">
                        {DAYS.map((day) => {
                            const session = sessions.find((s) => s.day_of_week === day);
                            // If there is no session, or session is rest day, it's considered "Rest" (Red)
                            const isWorkout = session && !session.is_rest_day;

                            return (
                                <button
                                    key={day}
                                    onClick={() => handleToggleDay(day)}
                                    disabled={togglingDay === day}
                                    className={`relative w-10 h-12 flex flex-col items-center justify-center rounded-xl transition-all ${
                                        isWorkout
                                            ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                                            : "bg-red-500/20 border border-red-500/30 text-red-400"
                                    } ${togglingDay === day ? "opacity-50" : "active:scale-95"}`}
                                >
                                    <span className="text-xs font-bold leading-none">
                                        {day === 0 ? "CN" : `T${day + 1}`}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}
                
                <div className="mt-6 flex items-center justify-center gap-4 text-xs text-white/40">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500/40 border border-emerald-500/50" />
                        <span>Ngày tập</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-sm bg-red-500/40 border border-red-500/50" />
                        <span>Ngày nghỉ</span>
                    </div>
                </div>

                <div className="mt-5">
                    <button
                        onClick={onClose}
                        className="w-full py-3 rounded-xl bg-white/5 text-white/80 font-medium hover:bg-white/10 transition-colors"
                    >
                        Xong
                    </button>
                </div>
            </div>
        </div>
    );
}
