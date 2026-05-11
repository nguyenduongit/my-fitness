"use client";

import { useState } from "react";
import { X, Plus, Trash2, Search, Moon, Dumbbell, GripVertical } from "lucide-react";
import {
    WorkoutSession,
    WorkoutSessionInsert,
    Exercise,
    ExerciseSet,
    ExerciseCategory,
    DayOfWeek,
    DAY_FULL_LABELS,
    CATEGORY_LABELS,
    CATEGORY_COLORS,
    CATEGORY_ICONS,
    EXERCISE_SUGGESTIONS,
} from "@/types/schedule";

interface WorkoutFormModalProps {
    defaultDay?: DayOfWeek;
    defaultWeek?: number;
    session?: WorkoutSession; // if editing
    onSave: (data: WorkoutSessionInsert) => Promise<void>;
    onClose: () => void;
}

function newSet(): ExerciseSet {
    return {
        id: crypto.randomUUID(),
        reps: 10,
        weight: null,
        duration_sec: null,
        set_type: "normal",
        completed: false,
    };
}

function newExercise(name: string, category: ExerciseCategory, idx: number): Exercise {
    const suggestion = EXERCISE_SUGGESTIONS.find((s) => s.name === name);
    const sets: ExerciseSet[] = Array.from({ length: suggestion?.default_sets ?? 3 }, () => ({
        id: crypto.randomUUID(),
        reps: suggestion?.default_reps ?? 10,
        weight: suggestion?.default_weight ?? null,
        duration_sec: null,
        set_type: "normal" as const,
        completed: false,
    }));
    return {
        id: crypto.randomUUID(),
        workout_id: "",
        name,
        category,
        sets,
        order_index: idx,
    };
}

export default function WorkoutFormModal({
    defaultDay = 1,
    defaultWeek = 1,
    session,
    onSave,
    onClose,
}: WorkoutFormModalProps) {
    const [step, setStep] = useState<"info" | "exercises">("info");
    const [loading, setLoading] = useState(false);

    // Info step
    const [day, setDay] = useState<DayOfWeek>(session?.day_of_week ?? defaultDay);
    const [week, setWeek] = useState(session?.week_number ?? defaultWeek);
    const [title, setTitle] = useState(session?.title ?? "");
    const [note, setNote] = useState(session?.note ?? "");
    const [isRestDay, setIsRestDay] = useState(session?.is_rest_day ?? false);

    // Exercises step
    const [exercises, setExercises] = useState<Exercise[]>(session?.exercises ?? []);
    const [search, setSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const filteredSuggestions = EXERCISE_SUGGESTIONS.filter(
        (s) =>
            s.name.toLowerCase().includes(search.toLowerCase()) &&
            !exercises.find((e) => e.name === s.name)
    );

    const handleAddExercise = (name: string, category: ExerciseCategory) => {
        setExercises((prev) => [...prev, newExercise(name, category, prev.length)]);
        setSearch("");
        setShowSuggestions(false);
    };

    const handleAddCustomExercise = () => {
        if (!search.trim()) return;
        handleAddExercise(search.trim(), "fullbody");
    };

    const handleRemoveExercise = (id: string) => {
        setExercises((prev) => prev.filter((e) => e.id !== id));
    };

    const handleAddSet = (exerciseId: string) => {
        setExercises((prev) =>
            prev.map((e) =>
                e.id === exerciseId ? { ...e, sets: [...e.sets, newSet()] } : e
            )
        );
    };

    const handleRemoveSet = (exerciseId: string, setId: string) => {
        setExercises((prev) =>
            prev.map((e) =>
                e.id === exerciseId
                    ? { ...e, sets: e.sets.filter((s) => s.id !== setId) }
                    : e
            )
        );
    };

    const handleSetChange = (
        exerciseId: string,
        setId: string,
        field: keyof ExerciseSet,
        value: unknown
    ) => {
        setExercises((prev) =>
            prev.map((e) =>
                e.id === exerciseId
                    ? {
                        ...e,
                        sets: e.sets.map((s) =>
                            s.id === setId ? { ...s, [field]: value } : s
                        ),
                    }
                    : e
            )
        );
    };

    const handleSave = async () => {
        if (!title.trim() && !isRestDay) return;
        setLoading(true);
        try {
            await onSave({
                day_of_week: day,
                week_number: week,
                title: isRestDay ? "Nghỉ ngơi" : title,
                note,
                exercises,
                is_rest_day: isRestDay,
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border border-white/10 max-h-[92vh] flex flex-col">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {session ? "Chỉnh sửa buổi tập" : "Thêm buổi tập"}
                        </h2>
                        <p className="text-xs text-white/40 mt-0.5">
                            {step === "info" ? "Bước 1: Thông tin" : "Bước 2: Bài tập"}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>

                {/* Step indicator */}
                <div className="px-5 pb-3 shrink-0">
                    <div className="flex gap-1.5">
                        {["info", "exercises"].map((s, i) => (
                            <div
                                key={s}
                                className={`h-1 rounded-full flex-1 transition-colors ${step === s || (step === "exercises" && i === 0)
                                        ? "bg-indigo-500"
                                        : "bg-white/10"
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-5 pb-6">
                    {step === "info" ? (
                        <div className="space-y-4">
                            {/* Day selector */}
                            <div>
                                <label className="text-xs text-white/50 mb-2 block">Thứ trong tuần</label>
                                <div className="flex gap-1.5 overflow-x-auto pb-1">
                                    {([1, 2, 3, 4, 5, 6, 0] as DayOfWeek[]).map((d) => (
                                        <button
                                            key={d}
                                            onClick={() => setDay(d)}
                                            className={`px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors ${day === d
                                                    ? "bg-indigo-500/30 border border-indigo-500/50 text-indigo-300"
                                                    : "bg-white/5 border border-white/10 text-white/50"
                                                }`}
                                        >
                                            {DAY_FULL_LABELS[d]}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Week selector */}
                            <div>
                                <label className="text-xs text-white/50 mb-2 block">Tuần luyện tập</label>
                                <div className="flex gap-2 flex-wrap">
                                    {[1, 2, 3, 4].map((w) => (
                                        <button
                                            key={w}
                                            onClick={() => setWeek(w)}
                                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${week === w
                                                    ? "bg-indigo-500/30 border border-indigo-500/50 text-indigo-300"
                                                    : "bg-white/5 border border-white/10 text-white/50"
                                                }`}
                                        >
                                            Tuần {w}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Rest day toggle */}
                            <div
                                onClick={() => setIsRestDay((v) => !v)}
                                className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-colors ${isRestDay
                                        ? "bg-purple-500/10 border-purple-500/30"
                                        : "bg-white/5 border-white/10"
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <Moon
                                        className={`w-5 h-5 ${isRestDay ? "text-purple-400" : "text-white/30"}`}
                                    />
                                    <div>
                                        <p className="text-sm font-medium text-white/80">Ngày nghỉ</p>
                                        <p className="text-xs text-white/40">Không tập, chỉ phục hồi</p>
                                    </div>
                                </div>
                                <div
                                    className={`w-10 h-5.5 rounded-full transition-colors relative ${isRestDay ? "bg-purple-500" : "bg-white/15"
                                        }`}
                                >
                                    <div
                                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isRestDay ? "translate-x-5" : "translate-x-0.5"
                                            }`}
                                    />
                                </div>
                            </div>

                            {!isRestDay && (
                                <>
                                    <div>
                                        <label className="text-xs text-white/50 mb-1.5 block">Tên buổi tập *</label>
                                        <input
                                            type="text"
                                            placeholder="VD: Push Day, Chest & Triceps..."
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-white/50 mb-1.5 block">Ghi chú (tuỳ chọn)</label>
                                        <textarea
                                            placeholder="Ghi chú cho buổi tập..."
                                            value={note}
                                            onChange={(e) => setNote(e.target.value)}
                                            rows={2}
                                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/25 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                onClick={() => (isRestDay ? handleSave() : setStep("exercises"))}
                                disabled={!isRestDay && !title.trim()}
                                className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-40 text-white font-semibold transition-colors"
                            >
                                {isRestDay ? "Lưu ngày nghỉ" : "Tiếp theo →"}
                            </button>
                        </div>
                    ) : (
                        /* Exercises step */
                        <div className="space-y-4">
                            {/* Search/add exercise */}
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Tìm hoặc nhập tên bài tập..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            {/* Suggestions dropdown */}
                            {showSuggestions && search.length > 0 && (
                                <div className="rounded-2xl bg-slate-800 border border-white/10 overflow-hidden">
                                    {filteredSuggestions.slice(0, 5).map((s) => (
                                        <button
                                            key={s.name}
                                            onClick={() => handleAddExercise(s.name, s.category)}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left border-b border-white/5 last:border-0"
                                        >
                                            <span className="text-base">{CATEGORY_ICONS[s.category]}</span>
                                            <div>
                                                <p className="text-sm text-white/90">{s.name}</p>
                                                <p className="text-xs text-white/40">{CATEGORY_LABELS[s.category]}</p>
                                            </div>
                                        </button>
                                    ))}
                                    {search.trim() && !EXERCISE_SUGGESTIONS.find((s) => s.name.toLowerCase() === search.toLowerCase()) && (
                                        <button
                                            onClick={handleAddCustomExercise}
                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 active:bg-white/10 transition-colors text-left"
                                        >
                                            <Plus className="w-4 h-4 text-indigo-400" />
                                            <p className="text-sm text-indigo-400">Thêm "{search}"</p>
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Exercise list */}
                            {exercises.length === 0 ? (
                                <div className="py-8 text-center">
                                    <Dumbbell className="w-8 h-8 text-white/10 mx-auto mb-2" />
                                    <p className="text-sm text-white/30">Chưa có bài tập nào</p>
                                    <p className="text-xs text-white/20 mt-1">Tìm kiếm và thêm bài tập ở trên</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {exercises.map((exercise, eIdx) => (
                                        <div
                                            key={exercise.id}
                                            className="p-4 rounded-2xl bg-white/5 border border-white/5"
                                        >
                                            {/* Exercise header */}
                                            <div className="flex items-center gap-2 mb-3">
                                                <span className="text-base">{CATEGORY_ICONS[exercise.category]}</span>
                                                <p className="text-sm font-semibold text-white/90 flex-1">{exercise.name}</p>
                                                <button
                                                    onClick={() => handleRemoveExercise(exercise.id)}
                                                    className="p-1.5 rounded-lg bg-red-500/10 active:bg-red-500/20"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                                </button>
                                            </div>

                                            {/* Sets */}
                                            <div className="space-y-2">
                                                {exercise.sets.map((set, sIdx) => (
                                                    <div key={set.id} className="flex items-center gap-2">
                                                        <span className="text-xs text-white/30 w-5 text-center">{sIdx + 1}</span>
                                                        <div className="flex-1 flex gap-2">
                                                            <div className="flex-1">
                                                                <input
                                                                    type="number"
                                                                    placeholder="KG"
                                                                    value={set.weight ?? ""}
                                                                    onChange={(e) =>
                                                                        handleSetChange(exercise.id, set.id, "weight", e.target.value ? Number(e.target.value) : null)
                                                                    }
                                                                    className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-center focus:outline-none focus:border-indigo-500/40 placeholder:text-white/20"
                                                                />
                                                                <p className="text-[9px] text-white/20 text-center mt-0.5">kg</p>
                                                            </div>
                                                            <div className="flex-1">
                                                                <input
                                                                    type="number"
                                                                    placeholder="10"
                                                                    value={set.reps ?? ""}
                                                                    onChange={(e) =>
                                                                        handleSetChange(exercise.id, set.id, "reps", e.target.value ? Number(e.target.value) : null)
                                                                    }
                                                                    className="w-full px-2 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-xs text-center focus:outline-none focus:border-indigo-500/40 placeholder:text-white/20"
                                                                />
                                                                <p className="text-[9px] text-white/20 text-center mt-0.5">reps</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleRemoveSet(exercise.id, set.id)}
                                                            className="p-1 rounded-lg text-white/20 active:text-red-400 transition-colors"
                                                            disabled={exercise.sets.length <= 1}
                                                        >
                                                            <X className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Add set */}
                                            <button
                                                onClick={() => handleAddSet(exercise.id)}
                                                className="mt-2 w-full py-1.5 rounded-xl text-xs text-indigo-400/70 border border-indigo-500/20 hover:bg-indigo-500/10 transition-colors flex items-center justify-center gap-1"
                                            >
                                                <Plus className="w-3 h-3" />
                                                Thêm set
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Save button */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    onClick={() => setStep("info")}
                                    className="px-4 py-4 rounded-2xl bg-white/5 text-white/60 font-medium text-sm transition-colors active:bg-white/10"
                                >
                                    ← Quay lại
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={loading || exercises.length === 0}
                                    className="flex-1 py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-40 text-white font-semibold transition-colors"
                                >
                                    {loading ? "Đang lưu..." : session ? "Cập nhật" : "Lưu lịch tập"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}