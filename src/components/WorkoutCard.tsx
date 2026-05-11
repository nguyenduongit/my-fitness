"use client";

import { useState } from "react";
import { Pencil, Trash2, Moon, Check, Plus } from "lucide-react";
import {
    WorkoutSession,
    Exercise,
    CATEGORY_COLORS,
    CATEGORY_ICONS,
} from "@/types/schedule";

interface WorkoutCardProps {
    session: WorkoutSession;
    isToday: boolean;
    isCompleted?: boolean;
    isToggling?: boolean;
    onEditExercise: (exercise: Exercise) => void;
    onDeleteExercise: (exerciseId: string) => void;
    onAddExercise: () => void;
    onToggleComplete?: () => void;
    onToggleRestDay: () => void;
}

export default function WorkoutCard({
    session,
    isToday,
    isCompleted: completed = false,
    isToggling = false,
    onEditExercise,
    onDeleteExercise,
    onAddExercise,
    onToggleComplete,
    onToggleRestDay,
}: WorkoutCardProps) {
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await onDeleteExercise(id);
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="space-y-4">
            {/* Header Actions for Today */}
            {isToday && !session.is_rest_day && session.exercises.length > 0 && onToggleComplete && (
                <div className="flex items-center justify-between px-2">
                    <p className="text-sm font-semibold text-white/80">Bài tập hôm nay</p>
                    <button
                        onClick={onToggleComplete}
                        disabled={isToggling}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                            completed
                                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                : "bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 active:bg-indigo-500/30"
                        } ${isToggling ? "opacity-50" : ""}`}
                    >
                        <Check className="w-4 h-4" />
                        {completed ? "Đã hoàn thành" : "Đánh dấu xong"}
                    </button>
                </div>
            )}

            {/* Exercises List */}
            <div className="space-y-3">
                {session.exercises.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 rounded-3xl bg-white/5 border border-white/5">
                        <p className="text-sm text-white/40">Chưa có bài tập nào</p>
                    </div>
                ) : (
                        session.exercises
                            .sort((a, b) => a.order_index - b.order_index)
                            .map((exercise) => (
                                <div
                                    key={exercise.id}
                                    className="flex flex-col gap-3 p-4 rounded-3xl bg-white/5 border border-white/5"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3 flex-1 min-w-0">
                                            {exercise.image_url ? (
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-white/10">
                                                    <img src={exercise.image_url} alt={exercise.name} className="w-full h-full object-cover" />
                                                </div>
                                            ) : (
                                                <div
                                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0"
                                                    style={{ backgroundColor: CATEGORY_COLORS[exercise.category] + "20" }}
                                                >
                                                    {CATEGORY_ICONS[exercise.category]}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <p className="text-base font-semibold text-white/90 leading-tight">{exercise.name}</p>
                                                {exercise.description && (
                                                    <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2">{exercise.description}</p>
                                                )}
                                            </div>
                                        </div>
                                        {/* Action buttons for exercise */}
                                        <div className="flex items-center gap-1 shrink-0">
                                            <button
                                                onClick={() => onEditExercise(exercise)}
                                                className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 active:bg-white/15 transition-colors"
                                            >
                                                <Pencil className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(exercise.id)}
                                                disabled={deletingId === exercise.id}
                                                className="p-2 rounded-xl bg-red-500/10 text-red-400/80 hover:bg-red-500/20 active:bg-red-500/30 transition-colors disabled:opacity-40"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="bg-white/5 rounded-2xl p-3">
                                        <div className="flex flex-col gap-1.5">
                                            {exercise.sets.map((set, idx) => (
                                                <div key={set.id} className="flex items-center gap-3 px-2">
                                                    <span className="text-xs font-medium text-white/30 w-4">{idx + 1}</span>
                                                    <div className="flex-1 flex gap-4">
                                                        {set.duration_sec ? (
                                                            <span className="text-sm font-medium text-white/80">{set.duration_sec} giây</span>
                                                        ) : (
                                                            <>
                                                                <span className="text-sm font-medium text-white/80">{set.weight ? `${set.weight} kg` : "- kg"}</span>
                                                                <span className="text-sm font-medium text-white/60">×</span>
                                                                <span className="text-sm font-medium text-white/80">{set.reps ? `${set.reps} reps` : "AMRAP"}</span>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                    )}

                    <div className="pt-2">
                        <button
                            onClick={onAddExercise}
                            className="w-full py-4 rounded-2xl border border-dashed border-white/20 text-white/60 hover:bg-white/5 hover:border-white/30 hover:text-white/80 transition-all flex items-center justify-center gap-2 font-medium text-sm"
                        >
                            <Plus className="w-4 h-4" />
                            Thêm bài tập
                        </button>
                    </div>
                </div>
        </div>
    );
}