"use client";

import { useState } from "react";
import { X, Search, Plus, ChevronUp } from "lucide-react";
import {
    MealType,
    MealPlanItemInsert,
    MEAL_LABELS,
    MEAL_ICONS,
    FOOD_SUGGESTIONS,
} from "@/types/meal-plan";
import { DayOfWeek } from "@/types/schedule";

interface AddFoodModalProps {
    defaultMealType: MealType;
    dayOfWeek: DayOfWeek;
    onAdd: (item: MealPlanItemInsert) => Promise<void>;
    onClose: () => void;
}

export default function AddFoodModal({
    defaultMealType,
    dayOfWeek,
    onAdd,
    onClose,
}: AddFoodModalProps) {
    const [search, setSearch] = useState("");
    const [selectedMeal, setSelectedMeal] = useState<MealType>(defaultMealType);
    const [loading, setLoading] = useState(false);
    const [showCustomForm, setShowCustomForm] = useState(false);
    
    // For expandable suggestion
    const [selectedFoodId, setSelectedFoodId] = useState<string | null>(null);
    const [inputQuantity, setInputQuantity] = useState<string>("");

    const [form, setForm] = useState({
        name: "",
        calories: "",
        protein: "",
        carbs: "",
        fat: "",
        quantity: "1",
        unit: "phần",
    });

    const filtered = FOOD_SUGGESTIONS.filter((f) =>
        f.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleSelectSuggestion = async (suggestion: typeof FOOD_SUGGESTIONS[0], actualQuantity: number) => {
        setLoading(true);
        try {
            const ratio = actualQuantity / suggestion.quantity;
            await onAdd({
                meal_type: selectedMeal,
                day_of_week: dayOfWeek,
                name: suggestion.name,
                calories: Math.round(suggestion.calories * ratio),
                protein: Number((suggestion.protein * ratio).toFixed(1)),
                carbs: Number((suggestion.carbs * ratio).toFixed(1)),
                fat: Number((suggestion.fat * ratio).toFixed(1)),
                quantity: actualQuantity,
                unit: suggestion.unit,
                order_index: 0,
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const handleCustomSubmit = async () => {
        if (!form.name || !form.calories) return;
        setLoading(true);
        try {
            await onAdd({
                meal_type: selectedMeal,
                day_of_week: dayOfWeek,
                name: form.name,
                calories: Number(form.calories),
                protein: Number(form.protein) || 0,
                carbs: Number(form.carbs) || 0,
                fat: Number(form.fat) || 0,
                quantity: Number(form.quantity) || 1,
                unit: form.unit,
                order_index: 0,
            });
            onClose();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Sheet */}
            <div className="relative w-full max-w-lg bg-slate-900 rounded-t-3xl border border-white/10 max-h-[90vh] flex flex-col">
                {/* Handle */}
                <div className="flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-10 h-1 rounded-full bg-white/20" />
                </div>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3 shrink-0">
                    <h2 className="text-lg font-semibold text-white">Thêm thực phẩm</h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors"
                    >
                        <X className="w-4 h-4 text-white/60" />
                    </button>
                </div>

                {/* Meal type selector */}
                <div className="px-5 pb-3 shrink-0">
                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                        {(["breakfast", "lunch", "dinner", "snack"] as MealType[]).map((m) => (
                            <button
                                key={m}
                                onClick={() => setSelectedMeal(m)}
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap text-sm font-medium transition-colors ${selectedMeal === m
                                        ? "bg-indigo-500/30 border border-indigo-500/50 text-indigo-300"
                                        : "bg-white/5 border border-white/10 text-white/50"
                                    }`}
                            >
                                <span>{MEAL_ICONS[m]}</span>
                                {MEAL_LABELS[m]}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Toggle custom / search */}
                <div className="px-5 pb-3 flex gap-2 shrink-0">
                    <button
                        onClick={() => setShowCustomForm(false)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${!showCustomForm
                                ? "bg-white/10 text-white"
                                : "text-white/40 hover:text-white/60"
                            }`}
                    >
                        Gợi ý
                    </button>
                    <button
                        onClick={() => setShowCustomForm(true)}
                        className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${showCustomForm
                                ? "bg-white/10 text-white"
                                : "text-white/40 hover:text-white/60"
                            }`}
                    >
                        Tự nhập
                    </button>
                </div>

                {/* Scrollable content */}
                <div className="overflow-y-auto flex-1 px-5 pb-8">
                    {!showCustomForm ? (
                        <>
                            {/* Search */}
                            <div className="relative mb-4">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                                <input
                                    type="text"
                                    placeholder="Tìm thực phẩm..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            {/* Suggestions list */}
                            <div className="space-y-2">
                                {filtered.map((item) => {
                                    const isExpanded = selectedFoodId === item.name;
                                    const baseQuantity = item.quantity;
                                    
                                    const currentQty = isExpanded ? (Number(inputQuantity) || 0) : baseQuantity;
                                    const ratio = currentQty / baseQuantity;
                                    
                                    const displayCals = Math.round(item.calories * ratio);
                                    const displayP = (item.protein * ratio).toFixed(1);
                                    const displayC = (item.carbs * ratio).toFixed(1);
                                    const displayF = (item.fat * ratio).toFixed(1);

                                    return (
                                        <div key={item.name} className={`bg-white/5 border rounded-2xl overflow-hidden transition-all ${isExpanded ? 'border-indigo-500/50' : 'border-white/5 hover:bg-white/10'}`}>
                                            <button
                                                onClick={() => {
                                                    if (isExpanded) {
                                                        setSelectedFoodId(null);
                                                    } else {
                                                        setSelectedFoodId(item.name);
                                                        setInputQuantity(String(item.quantity));
                                                    }
                                                }}
                                                className="w-full flex items-center justify-between p-3 text-left active:bg-white/5"
                                            >
                                                <div>
                                                    <p className="text-sm font-medium text-white/90">{item.name}</p>
                                                    <p className="text-xs text-white/40 mt-0.5">
                                                        {baseQuantity} {item.unit} · P:{item.protein}g C:{item.carbs}g F:{item.fat}g
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-bold text-amber-400">{item.calories} kcal</span>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-indigo-400" />
                                                    ) : (
                                                        <Plus className="w-5 h-5 text-white/40" />
                                                    )}
                                                </div>
                                            </button>
                                            
                                            {isExpanded && (
                                                <div className="px-3 pb-3 pt-1 border-t border-white/5">
                                                    <div className="flex items-end gap-3">
                                                        <div className="flex-1">
                                                            <label className="text-xs text-white/50 mb-1.5 block">
                                                                Nhập số lượng ({item.unit})
                                                            </label>
                                                            <input
                                                                type="number"
                                                                value={inputQuantity}
                                                                onChange={(e) => setInputQuantity(e.target.value)}
                                                                className="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <button
                                                            onClick={() => handleSelectSuggestion(item, currentQty)}
                                                            disabled={loading || !currentQty || currentQty <= 0}
                                                            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl text-sm font-semibold text-white transition-colors disabled:opacity-50"
                                                        >
                                                            Thêm
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="flex justify-between items-center mt-3 px-1 text-xs text-white/60">
                                                        <span>Thực tế: <span className="text-amber-400 font-bold ml-1">{displayCals} kcal</span></span>
                                                        <div className="flex gap-3">
                                                            <span>P: <span className="text-white font-medium">{displayP}g</span></span>
                                                            <span>C: <span className="text-white font-medium">{displayC}g</span></span>
                                                            <span>F: <span className="text-white font-medium">{displayF}g</span></span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    ) : (
                        /* Custom form */
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Tên thực phẩm *</label>
                                <input
                                    type="text"
                                    placeholder="VD: Cơm gà"
                                    value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs text-white/50 mb-1.5 block">Số lượng</label>
                                    <input
                                        type="number"
                                        value={form.quantity}
                                        onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-white/50 mb-1.5 block">Đơn vị</label>
                                    <input
                                        type="text"
                                        placeholder="g, ml, cái..."
                                        value={form.unit}
                                        onChange={(e) => setForm({ ...form, unit: e.target.value })}
                                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-white/50 mb-1.5 block">Calories (kcal) *</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={form.calories}
                                    onChange={(e) => setForm({ ...form, calories: e.target.value })}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                {(["protein", "carbs", "fat"] as const).map((macro) => (
                                    <div key={macro}>
                                        <label className="text-xs text-white/50 mb-1.5 block capitalize">
                                            {macro === "protein" ? "Đạm (g)" : macro === "carbs" ? "Tinh bột (g)" : "Béo (g)"}
                                        </label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={form[macro]}
                                            onChange={(e) => setForm({ ...form, [macro]: e.target.value })}
                                            className="w-full px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={handleCustomSubmit}
                                disabled={!form.name || !form.calories || loading}
                                className="w-full py-4 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold transition-colors mt-2"
                            >
                                {loading ? "Đang thêm..." : "Thêm thực phẩm"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}