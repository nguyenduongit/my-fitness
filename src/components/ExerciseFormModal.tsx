"use client";

import { useState } from "react";
import { X, Plus, Dumbbell, Clock, Image as ImageIcon } from "lucide-react";
import {
    Exercise,
    ExerciseSet,
} from "@/types/schedule";

interface ExerciseFormModalProps {
    exercise?: Exercise; // if editing
    onSave: (exercise: Exercise) => Promise<void>;
    onClose: () => void;
}

function newSet(isTimeBased: boolean): ExerciseSet {
    return {
        id: crypto.randomUUID(),
        reps: isTimeBased ? null : 10,
        weight: null,
        duration_sec: isTimeBased ? 60 : null,
        set_type: "normal",
        completed: false,
    };
}

export default function ExerciseFormModal({
    exercise,
    onSave,
    onClose,
}: ExerciseFormModalProps) {
    const [loading, setLoading] = useState(false);

    // If no exercise is passed, we create a new one
    const [currentExercise, setCurrentExercise] = useState<Exercise>(
        exercise || {
            id: crypto.randomUUID(),
            workout_id: "",
            name: "",
            description: "",
            image_url: "",
            category: "fullbody",
            sets: [newSet(false)],
            order_index: 0,
        }
    );

    const isTimeBased = currentExercise.sets[0]?.duration_sec != null;

    const handleFieldChange = (field: keyof Exercise, value: any) => {
        setCurrentExercise((prev) => ({ ...prev, [field]: value }));
    };

    const handleAddSet = () => {
        setCurrentExercise((prev) => ({
            ...prev,
            sets: [...prev.sets, newSet(isTimeBased)],
        }));
    };

    const handleRemoveSet = (setId: string) => {
        setCurrentExercise((prev) => ({
            ...prev,
            sets: prev.sets.filter((s) => s.id !== setId),
        }));
    };

    const handleSetChange = (setId: string, field: keyof ExerciseSet, value: unknown) => {
        setCurrentExercise((prev) => ({
            ...prev,
            sets: prev.sets.map((s) => (s.id === setId ? { ...s, [field]: value } : s)),
        }));
    };

    const toggleExerciseType = () => {
        setCurrentExercise((prev) => {
            const newSets = prev.sets.map((s) => ({
                ...s,
                reps: isTimeBased ? 10 : null,
                weight: null,
                duration_sec: isTimeBased ? null : 60,
            }));
            return { ...prev, sets: newSets };
        });
    };

    const handleSave = async () => {
        if (!currentExercise.name.trim()) return;
        setLoading(true);
        try {
            await onSave(currentExercise);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end justify-center pb-[85px]">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border border-white/10 max-h-[85vh] flex flex-col shadow-2xl">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0">
                    <div>
                        <h2 className="text-lg font-semibold text-white">
                            {exercise ? "Chỉnh sửa bài tập" : "Thêm bài tập mới"}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                    >
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>

                {/* Content */}
                <div className="overflow-y-auto flex-1 px-5 pb-6 space-y-4 mt-2">
                    {/* Name */}
                    <input
                        type="text"
                        placeholder="Tên bài tập (VD: Push up, Plank...)"
                        value={currentExercise.name}
                        onChange={(e) => handleFieldChange("name", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50 font-medium"
                    />

                    {/* Image URL */}
                    <div className="relative">
                        <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                        <input
                            type="text"
                            placeholder="Link ảnh minh hoạ (tuỳ chọn)"
                            value={currentExercise.image_url || ""}
                            onChange={(e) => handleFieldChange("image_url", e.target.value)}
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>

                    {/* Description */}
                    <textarea
                        placeholder="Mô tả hoặc lưu ý khi tập..."
                        value={currentExercise.description || ""}
                        onChange={(e) => handleFieldChange("description", e.target.value)}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50 resize-none"
                    />

                    {/* Sets Header */}
                    <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <p className="text-sm font-medium text-white/80">Chi tiết các Set</p>
                        <button
                            onClick={toggleExerciseType}
                            className="flex items-center gap-1.5 text-xs bg-white/5 px-3 py-1.5 rounded-lg text-white/60 active:bg-white/10 transition-colors"
                        >
                            {isTimeBased ? <Dumbbell className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                            {isTimeBased ? "Đổi sang Reps/KG" : "Đổi sang Thời gian"}
                        </button>
                    </div>

                    {/* Sets List */}
                    <div className="space-y-2">
                        {currentExercise.sets.map((set, sIdx) => (
                            <div key={set.id} className="flex items-center gap-2">
                                <span className="text-xs font-medium text-white/30 w-6 text-center bg-white/5 py-2 rounded-lg">{sIdx + 1}</span>
                                
                                {isTimeBased ? (
                                    <div className="flex-1 flex items-center gap-3">
                                        <input
                                            type="number"
                                            placeholder="Thời gian"
                                            value={set.duration_sec ?? ""}
                                            onChange={(e) =>
                                                handleSetChange(set.id, "duration_sec", e.target.value ? Number(e.target.value) : null)
                                            }
                                            className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center focus:outline-none focus:border-indigo-500/40"
                                        />
                                        <span className="text-sm text-white/40">giây</span>
                                    </div>
                                ) : (
                                    <div className="flex-1 flex gap-2">
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                placeholder="Trọng lượng"
                                                value={set.weight ?? ""}
                                                onChange={(e) =>
                                                    handleSetChange(set.id, "weight", e.target.value ? Number(e.target.value) : null)
                                                }
                                                className="w-full pl-3 pr-8 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center focus:outline-none focus:border-indigo-500/40"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">kg</span>
                                        </div>
                                        <div className="flex-1 relative">
                                            <input
                                                type="number"
                                                placeholder="Số Reps"
                                                value={set.reps ?? ""}
                                                onChange={(e) =>
                                                    handleSetChange(set.id, "reps", e.target.value ? Number(e.target.value) : null)
                                                }
                                                className="w-full pl-3 pr-9 py-2.5 bg-white/5 border border-white/10 rounded-lg text-white text-sm text-center focus:outline-none focus:border-indigo-500/40"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">reps</span>
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => handleRemoveSet(set.id)}
                                    className="p-2.5 rounded-lg text-white/20 active:bg-red-500/10 active:text-red-400 transition-colors"
                                    disabled={currentExercise.sets.length <= 1}
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={handleAddSet}
                        className="w-full py-2.5 rounded-xl text-sm font-medium text-white/50 bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-center gap-1.5"
                    >
                        <Plus className="w-4 h-4" />
                        Thêm set
                    </button>

                    {/* Save button */}
                    <div className="pt-4 sticky bottom-0 bg-slate-900 pb-2">
                        <button
                            onClick={handleSave}
                            disabled={loading || !currentExercise.name.trim()}
                            className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-40 text-white font-semibold transition-colors shadow-lg shadow-indigo-500/20"
                        >
                            {loading ? "Đang lưu..." : "Lưu bài tập"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}