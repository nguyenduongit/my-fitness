"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { FoodLibraryItem, FoodLibraryItemInsert } from "@/types/food-library";

interface FoodLibraryFormProps {
    editItem?: FoodLibraryItem | null;
    onSave: (item: FoodLibraryItemInsert) => Promise<void>;
    onClose: () => void;
}

export default function FoodLibraryForm({
    editItem,
    onSave,
    onClose,
}: FoodLibraryFormProps) {
    const [form, setForm] = useState({
        name: editItem?.name || "",
        calories: editItem?.calories ? String(editItem.calories) : "",
        protein: editItem?.protein ? String(editItem.protein) : "",
        carbs: editItem?.carbs ? String(editItem.carbs) : "",
        fat: editItem?.fat ? String(editItem.fat) : "",
        unit: editItem?.unit || "g",
        quantity: editItem?.quantity ? String(editItem.quantity) : "100",
        calcium: editItem?.calcium ? String(editItem.calcium) : "",
        magnesium: editItem?.magnesium ? String(editItem.magnesium) : "",
        zinc: editItem?.zinc ? String(editItem.zinc) : "",
        iron: editItem?.iron ? String(editItem.iron) : "",
        vitamin_a: editItem?.vitamin_a ? String(editItem.vitamin_a) : "",
        vitamin_c: editItem?.vitamin_c ? String(editItem.vitamin_c) : "",
        vitamin_d: editItem?.vitamin_d ? String(editItem.vitamin_d) : "",
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (key: string, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        if (!form.name || !form.calories) return;
        setLoading(true);
        try {
            const payload: FoodLibraryItemInsert = {
                name: form.name,
                calories: Number(form.calories),
                protein: Number(form.protein) || 0,
                carbs: Number(form.carbs) || 0,
                fat: Number(form.fat) || 0,
                unit: form.unit,
                quantity: Number(form.quantity) || 100,
                calcium: Number(form.calcium) || 0,
                magnesium: Number(form.magnesium) || 0,
                zinc: Number(form.zinc) || 0,
                iron: Number(form.iron) || 0,
                vitamin_a: Number(form.vitamin_a) || 0,
                vitamin_c: Number(form.vitamin_c) || 0,
                vitamin_d: Number(form.vitamin_d) || 0,
            };
            await onSave(payload);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 rounded-t-3xl p-6 animate-slide-up">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                        {editItem ? "Sửa thực phẩm" : "Thêm thực phẩm"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-3 max-h-[70vh] overflow-y-auto">
                    {/* Macro cơ bản */}
                    <input
                        placeholder="Tên thực phẩm *"
                        value={form.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            placeholder="Calories (kcal) *"
                            type="number"
                            value={form.calories}
                            onChange={(e) => handleChange("calories", e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Số lượng (g/ml)"
                            type="number"
                            value={form.quantity}
                            onChange={(e) => handleChange("quantity", e.target.value)}
                            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                    <input
                        placeholder="Đơn vị (g, ml, quả...)"
                        value={form.unit}
                        onChange={(e) => handleChange("unit", e.target.value)}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                    />
                    <div className="grid grid-cols-3 gap-3">
                        <input
                            placeholder="Đạm (g)"
                            type="number"
                            value={form.protein}
                            onChange={(e) => handleChange("protein", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Tinh bột (g)"
                            type="number"
                            value={form.carbs}
                            onChange={(e) => handleChange("carbs", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Béo (g)"
                            type="number"
                            value={form.fat}
                            onChange={(e) => handleChange("fat", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>

                    {/* Vi chất */}
                    <p className="text-sm text-white/50 mt-2">Vi chất (không bắt buộc)</p>
                    <div className="grid grid-cols-2 gap-3">
                        <input
                            placeholder="Canxi (mg)"
                            type="number"
                            value={form.calcium}
                            onChange={(e) => handleChange("calcium", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Magie (mg)"
                            type="number"
                            value={form.magnesium}
                            onChange={(e) => handleChange("magnesium", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Kẽm (mg)"
                            type="number"
                            value={form.zinc}
                            onChange={(e) => handleChange("zinc", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Sắt (mg)"
                            type="number"
                            value={form.iron}
                            onChange={(e) => handleChange("iron", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Vitamin A (IU)"
                            type="number"
                            value={form.vitamin_a}
                            onChange={(e) => handleChange("vitamin_a", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Vitamin C (mg)"
                            type="number"
                            value={form.vitamin_c}
                            onChange={(e) => handleChange("vitamin_c", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                        <input
                            placeholder="Vitamin D (IU)"
                            type="number"
                            value={form.vitamin_d}
                            onChange={(e) => handleChange("vitamin_d", e.target.value)}
                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                        />
                    </div>
                </div>

                <button
                    onClick={handleSubmit}
                    disabled={loading || !form.name || !form.calories}
                    className="w-full mt-4 py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl font-semibold text-white transition-colors disabled:opacity-50"
                >
                    {loading ? "Đang xử lý..." : editItem ? "Cập nhật" : "Thêm thực phẩm"}
                </button>
            </div>
        </div>
    );
}