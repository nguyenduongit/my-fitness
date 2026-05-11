"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Pencil, Trash2, Moon, Check } from "lucide-react";
import {
    WorkoutSession,
    DAY_FULL_LABELS,
    CATEGORY_COLORS,
    CATEGORY_LABELS,
    CATEGORY_ICONS,
} from "@/types/schedule";

interface WorkoutCardProps {
    session: WorkoutSession;
    isToday: boolean;
    isCompleted?: boolean;
    isToggling?: boolean;
    onEdit: (session: WorkoutSession) => void;
    onDelete: (id: string) => void;
    onToggleComplete?: () => void;
}

export default function WorkoutCard({
    session,
    isToday,
    isCompleted: completed = false,
    isToggling = false,
    onEdit,
    onDelete,
    onToggleComplete,
}: WorkoutCardProps) {
    const [expanded, setExpanded] = useState(isToday);
    const [deleting, setDeleting] = useState(false);

    const totalSets = session.exercises.reduce((s, e) => s + e.sets.length, 0);
    const categories = [...new Set(session.exercises.map((e) => e.category))];

    const handleDelete = async () => {
        setDeleting(true);
        try {
            await onDelete(session.id);
        } finally {
            setDeleting(false);
        }
    };

    return (
        <div
            className={`rounded-3xl border transition-all duration-300 overflow-hidden ${
                completed
                    ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/8 to-teal-500/5"
                    : isToday
                        ? "border-indigo-500/40 bg-gradient-to-br from-indigo-500/10 to-purple-500/5"
                        : "border-white/5 bg-white/3"
            }`}
        >
            {/* Card header */}
            <div
                className="flex items-center p-4 cursor-pointer select-none active:bg-white/5 transition-colors"
                onClick={() => setExpanded((v) => !v)}
            >
                {/* Day badge */}
                <div
                    className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center shrink-0 mr-4 ${
                        completed
                            ? "bg-emerald-500/30 border border-emerald-500/40"
                            : isToday
                                ? "bg-indigo-500/30 border border-indigo-500/40"
                                : session.is_rest_day
                                    ? "bg-white/5 border border-white/10"
                                    : "bg-white/8 border border-white/10"
                    }`}
                >
                    {completed ? (
                        <Check className="w-5 h-5 text-emerald-400" />
                    ) : (
                        <>
                            <span
                                className={`text-xs font-bold ${isToday ? "text-indigo-300" : "text-white/50"}`}
                            >
                                {DAY_FULL_LABELS[session.day_of_week].slice(0, 2).toUpperCase()}
                            </span>
                            <span
                                className={`text-[10px] ${isToday ? "text-indigo-400" : "text-white/30"}`}
                            >
                                T{session.week_number}
                            </span>
                        </>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        {isToday && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                HÔM NAY
                            </span>
                        )}
                        {completed && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                ✓ HOÀN THÀNH
                            </span>
                        )}
                    </div>
                    <h3 className={`text-sm font-semibold truncate ${completed ? "text-white/50 line-through" : "text-white/90"}`}>
                        {session.is_rest_day ? "🛌 Nghỉ ngơi" : session.title}
                    </h3>
                    {!session.is_rest_day && (
                        <p className="text-xs text-white/40 mt-0.5">
                            {session.exercises.length} bài · {totalSets} set
                        </p>
                    )}
                    {/* Category pills */}
                    {!session.is_rest_day && categories.length > 0 && (
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                            {categories.slice(0, 3).map((cat) => (
                                <span
                                    key={cat}
                                    className="text-[10px] px-1.5 py-0.5 rounded-full"
                                    style={{
                                        backgroundColor: CATEGORY_COLORS[cat] + "22",
                                        color: CATEGORY_COLORS[cat],
                                        border: `1px solid ${CATEGORY_COLORS[cat]}33`,
                                    }}
                                >
                                    {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat]}
                                </span>
                            ))}
                            {categories.length > 3 && (
                                <span className="text-[10px] text-white/30">+{categories.length - 3}</span>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-2">
                    {/* Complete button (only for today, not rest day) */}
                    {isToday && !session.is_rest_day && onToggleComplete && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onToggleComplete();
                            }}
                            disabled={isToggling}
                            className={`p-2 rounded-xl transition-all ${
                                completed
                                    ? "bg-emerald-500/20 active:bg-emerald-500/30"
                                    : "bg-white/5 active:bg-emerald-500/15"
                            } ${isToggling ? "opacity-50" : ""}`}
                        >
                            <Check className={`w-4 h-4 ${completed ? "text-emerald-400" : "text-white/30"}`} />
                        </button>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onEdit(session);
                        }}
                        className="p-2 rounded-xl bg-white/5 active:bg-white/15 transition-colors"
                    >
                        <Pencil className="w-3.5 h-3.5 text-white/40" />
                    </button>
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleDelete();
                        }}
                        disabled={deleting}
                        className="p-2 rounded-xl bg-red-500/5 active:bg-red-500/15 transition-colors disabled:opacity-40"
                    >
                        <Trash2 className="w-3.5 h-3.5 text-red-400/60" />
                    </button>
                    <div className="ml-1 text-white/20">
                        {expanded ? (
                            <ChevronUp className="w-4 h-4" />
                        ) : (
                            <ChevronDown className="w-4 h-4" />
                        )}
                    </div>
                </div>
            </div>

            {/* Expanded exercise list */}
            {expanded && !session.is_rest_day && session.exercises.length > 0 && (
                <div className="px-4 pb-4 space-y-2">
                    <div className="h-px bg-white/5 mb-3" />
                    {session.exercises
                        .sort((a, b) => a.order_index - b.order_index)
                        .map((exercise) => (
                            <div
                                key={exercise.id}
                                className="flex items-start gap-3 p-3 rounded-2xl bg-white/3 border border-white/5"
                            >
                                <div
                                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 mt-0.5"
                                    style={{ backgroundColor: CATEGORY_COLORS[exercise.category] + "20" }}
                                >
                                    {CATEGORY_ICONS[exercise.category]}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white/90">{exercise.name}</p>
                                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                                        {exercise.sets.map((set) => (
                                            <span
                                                key={set.id}
                                                className={`text-[11px] px-2 py-0.5 rounded-lg font-medium ${set.set_type === "warmup"
                                                        ? "bg-yellow-500/10 text-yellow-400/70"
                                                        : "bg-white/8 text-white/60"
                                                    }`}
                                            >
                                                {set.weight ? `${set.weight}kg × ` : ""}
                                                {set.reps
                                                    ? `${set.reps} reps`
                                                    : set.duration_sec
                                                        ? `${set.duration_sec}s`
                                                        : "AMRAP"}
                                            </span>
                                        ))}
                                    </div>
                                    {exercise.note && (
                                        <p className="text-xs text-white/30 mt-1 italic">{exercise.note}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    {session.note && (
                        <p className="text-xs text-white/30 italic pt-1 px-1">{session.note}</p>
                    )}
                </div>
            )}

            {expanded && session.is_rest_day && (
                <div className="px-4 pb-4">
                    <div className="h-px bg-white/5 mb-3" />
                    <div className="flex items-center gap-2 text-white/30 py-2">
                        <Moon className="w-4 h-4" />
                        <p className="text-xs">Ngày nghỉ ngơi và phục hồi cơ thể</p>
                    </div>
                </div>
            )}
        </div>
    );
}