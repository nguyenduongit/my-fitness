"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Search, ChevronDown, Plus } from "lucide-react";
import { getFoodLibrary } from "@/lib/food-library";
import { FoodLibraryItem } from "@/types/food-library";

interface SelectedFood {
    id: string;
    name: string;
    baseCalories: number;   // cho 100g hoặc 1 đơn vị chuẩn
    protein: number;
    carbs: number;
    fat: number;
    unit: string;
    baseQuantity: number;   // khối lượng chuẩn (vd: 100g)
}

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    onAdd: (food: {
        name: string;
        quantity: number;
        unit: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    }) => void;
}

export default function AddFoodModal({ isOpen, onClose, onAdd }: AddFoodModalProps) {
    const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPicker, setShowPicker] = useState(true);
    const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
    const [quantity, setQuantity] = useState("100");
    const [unit, setUnit] = useState("g");

    // Tải danh sách thực phẩm từ Supabase
    const loadLibrary = useCallback(async () => {
        setLoading(true);
        try {
            const data = await getFoodLibrary();
            setFoodLibrary(data);
        } catch (error) {
            console.error("Không thể tải thư viện thực phẩm:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            loadLibrary();
            // Reset state khi mở lại
            setSearch("");
            setShowPicker(true);
            setSelectedFood(null);
            setQuantity("100");
        }
    }, [isOpen, loadLibrary]);

    // Lọc danh sách theo từ khóa
    const filtered = foodLibrary.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    // Tính toán macro theo số lượng người dùng nhập
    const calculateMacros = (food: SelectedFood, qty: number) => {
        const ratio = qty / food.baseQuantity;
        return {
            calories: Math.round(food.baseCalories * ratio),
            protein: +(food.protein * ratio).toFixed(1),
            carbs: +(food.carbs * ratio).toFixed(1),
            fat: +(food.fat * ratio).toFixed(1),
        };
    };

    // Khi chọn một thực phẩm từ danh sách
    const handleSelectFood = (item: FoodLibraryItem) => {
        setSelectedFood({
            id: item.id,
            name: item.name,
            baseCalories: item.calories,
            protein: item.protein,
            carbs: item.carbs,
            fat: item.fat,
            unit: item.unit,
            baseQuantity: item.quantity || 100,
        });
        setUnit(item.unit || "g");
        setQuantity(String(item.quantity || 100));
        setShowPicker(false);
    };

    // Xác nhận thêm vào thực đơn
    const handleAdd = () => {
        if (!selectedFood) return;
        const qty = parseFloat(quantity) || 0;
        if (qty <= 0) return;
        const macros = calculateMacros(selectedFood, qty);
        onAdd({
            name: selectedFood.name,
            quantity: qty,
            unit: unit,
            ...macros,
        });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md bg-zinc-900 rounded-t-3xl p-6 animate-slide-up max-h-[85vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                        {showPicker ? "Chọn thực phẩm" : "Thêm vào thực đơn"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Giao diện chọn từ thư viện */}
                {showPicker ? (
                    <>
                        {/* Thanh tìm kiếm */}
                        <div className="relative mb-4">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm thực phẩm..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                                autoFocus
                            />
                        </div>

                        {/* Danh sách */}
                        <div className="flex-1 overflow-y-auto -mx-2 px-2">
                            {loading ? (
                                <p className="text-center text-white/50 py-8">Đang tải...</p>
                            ) : filtered.length === 0 ? (
                                <div className="text-center text-white/50 py-8">
                                    {search.trim() ? "Không tìm thấy thực phẩm." : "Thư viện trống, hãy thêm vào trong Cài đặt."}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filtered.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectFood(item)}
                                            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors text-left"
                                        >
                                            <div>
                                                <div className="text-white font-medium">{item.name}</div>
                                                <div className="text-xs text-white/40">
                                                    {item.calories} kcal • P: {item.protein}g • C: {item.carbs}g • F: {item.fat}g
                                                </div>
                                            </div>
                                            <ChevronDown size={18} className="text-white/30 -rotate-90" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Giao diện nhập số lượng sau khi đã chọn thực phẩm */
                    <div className="flex-1 flex flex-col">
                        {/* Tên thực phẩm đã chọn */}
                        <div className="mb-4 p-3 bg-white/5 rounded-xl flex items-center justify-between">
                            <div>
                                <div className="text-white font-medium">{selectedFood?.name}</div>
                                <div className="text-xs text-white/40">
                                    Mỗi {selectedFood?.baseQuantity}{selectedFood?.unit}: {selectedFood?.baseCalories} kcal
                                </div>
                            </div>
                            <button
                                onClick={() => setShowPicker(true)}
                                className="text-indigo-400 text-sm font-medium"
                            >
                                Đổi
                            </button>
                        </div>

                        {/* Nhập số lượng & đơn vị */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Số lượng</label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-lg focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">Đơn vị</label>
                                <input
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-lg focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>

                        {/* Macro tính toán */}
                        {selectedFood && (() => {
                            const qty = parseFloat(quantity) || 0;
                            const macros = calculateMacros(selectedFood, qty);
                            return (
                                <div className="bg-white/5 rounded-xl p-4 mb-6">
                                    <h3 className="text-white/70 text-sm mb-2">Thông tin dinh dưỡng dự kiến</h3>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="text-white/60">Calories</div>
                                        <div className="text-white font-medium text-right">{macros.calories} kcal</div>
                                        <div className="text-white/60">Đạm (Protein)</div>
                                        <div className="text-white text-right">{macros.protein}g</div>
                                        <div className="text-white/60">Tinh bột (Carbs)</div>
                                        <div className="text-white text-right">{macros.carbs}g</div>
                                        <div className="text-white/60">Chất béo (Fat)</div>
                                        <div className="text-white text-right">{macros.fat}g</div>
                                    </div>
                                </div>
                            );
                        })()}

                        {/* Nút thêm */}
                        <button
                            onClick={handleAdd}
                            disabled={!selectedFood || parseFloat(quantity) <= 0}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 mt-auto"
                        >
                            Thêm vào thực đơn
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}