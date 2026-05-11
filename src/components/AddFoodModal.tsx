"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Search, ChevronDown, ImageIcon } from "lucide-react";
import { getFoodLibrary } from "@/lib/food-library";
import { FoodLibraryItem } from "@/types/food-library";

interface SelectedFood {
    id: string; // id từ food_library hoặc id của meal_plan khi sửa
    name: string;
    baseCalories: number;
    protein: number;
    carbs: number;
    fat: number;
    thumbnailBase64: string | null;
    unit: string;
    baseQuantity: number;
}

interface AddFoodModalProps {
    isOpen: boolean;
    onClose: () => void;
    // Dùng cho thêm mới
    onAdd?: (food: {
        name: string;
        quantity: number;
        unit: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        thumbnail_base64: string | null;
    }) => void;
    // Dùng cho sửa
    onUpdate?: (
        id: string,
        updates: {
            name: string;
            quantity: number;
            unit: string;
            calories: number;
            protein: number;
            carbs: number;
            fat: number;
            thumbnail_base64: string | null;
        }
    ) => Promise<void>;
    initialItem?: {
        id: string; // ID của meal_plan_item cần sửa
        name: string;
        quantity: number;
        unit: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        thumbnail_base64: string | null;
        meal_type: string;
    };
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === "string") return message;
    }

    return "Không thể tải thư viện thực phẩm. Vui lòng thử lại.";
}

export default function AddFoodModal({
    isOpen,
    onClose,
    onAdd,
    onUpdate,
    initialItem,
}: AddFoodModalProps) {
    const [foodLibrary, setFoodLibrary] = useState<FoodLibraryItem[]>([]);
    const [search, setSearch] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [showPicker, setShowPicker] = useState(true);
    const [selectedFood, setSelectedFood] = useState<SelectedFood | null>(null);
    const [quantity, setQuantity] = useState("100");
    const [unit, setUnit] = useState("g");

    const isEditing = !!initialItem;

    // Tải thư viện thực phẩm từ Supabase
    const loadLibrary = useCallback(async () => {
        setLoading(true);
        setLoadError("");
        try {
            const data = await getFoodLibrary();
            setFoodLibrary(data);
            return data;
        } catch (error) {
            console.error("Không thể tải thư viện thực phẩm:", error);
            setFoodLibrary([]);
            setLoadError(getErrorMessage(error));
            return [];
        } finally {
            setLoading(false);
        }
    }, []);

    const initializeModal = useCallback(async () => {
        const library = await loadLibrary();

        if (isEditing && initialItem) {
            // Khi sửa: tự động set selectedFood và vào thẳng màn hình nhập số lượng
            // Tìm item trong thư viện hoặc tạo selectedFood từ initialItem
            const found = library.find((f) => f.name === initialItem.name);
            const base = found
                ? {
                    id: found.id,
                    name: found.name,
                    baseCalories: found.calories,
                    protein: found.protein,
                    carbs: found.carbs,
                    fat: found.fat,
                    thumbnailBase64: found.thumbnail_base64,
                    unit: found.unit,
                    baseQuantity: found.quantity || 100,
                }
                : {
                    id: initialItem.id,
                    name: initialItem.name,
                    baseCalories: initialItem.calories,
                    protein: initialItem.protein,
                    carbs: initialItem.carbs,
                    fat: initialItem.fat,
                    thumbnailBase64: initialItem.thumbnail_base64,
                    unit: initialItem.unit,
                    baseQuantity: 100, // fallback
                };
            setSelectedFood(base);
            setQuantity(String(initialItem.quantity));
            setUnit(initialItem.unit);
            setShowPicker(false);
        } else {
            // Reset về trạng thái thêm mới
            setSearch("");
            setShowPicker(true);
            setSelectedFood(null);
            setQuantity("100");
            setUnit("g");
        }
    }, [initialItem, isEditing, loadLibrary]);

    useEffect(() => {
        if (!isOpen) return;

        const timeoutId = window.setTimeout(() => {
            void initializeModal();
        }, 0);

        return () => window.clearTimeout(timeoutId);
    }, [isOpen, initializeModal]);

    // Lọc danh sách theo từ khóa
    const filtered = foodLibrary.filter((item) =>
        item.name.toLowerCase().includes(search.toLowerCase())
    );

    // Tính toán macro theo số lượng
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
            thumbnailBase64: item.thumbnail_base64,
            unit: item.unit,
            baseQuantity: item.quantity || 100,
        });
        setUnit(item.unit || "g");
        setQuantity(String(item.quantity || 100));
        setShowPicker(false);
    };

    // Xác nhận thêm hoặc sửa
    const handleSave = async () => {
        if (!selectedFood) return;
        const qty = parseFloat(quantity) || 0;
        if (qty <= 0) return;
        const macros = calculateMacros(selectedFood, qty);

        if (isEditing && onUpdate && initialItem) {
            // Gọi onUpdate với các giá trị mới
            await onUpdate(initialItem.id, {
                name: selectedFood.name, // có thể giữ nguyên tên cũ
                quantity: qty,
                unit,
                thumbnail_base64: selectedFood.thumbnailBase64,
                ...macros,
            });
        } else if (!isEditing && onAdd) {
            onAdd({
                name: selectedFood.name,
                quantity: qty,
                unit,
                thumbnail_base64: selectedFood.thumbnailBase64,
                ...macros,
            });
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
            style={{
                paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
                paddingTop: "env(safe-area-inset-top, 0px)",
            }}
        >
            <div className="w-full max-w-md bg-zinc-900 rounded-t-3xl p-6 animate-slide-up max-h-[calc(100dvh-7rem)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white">
                        {isEditing
                            ? "Sửa món ăn"
                            : showPicker
                                ? "Chọn thực phẩm"
                                : "Thêm vào thực đơn"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white/10 rounded-xl text-white"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Giao diện chọn từ thư viện (chỉ với thêm mới) */}
                {!isEditing && showPicker ? (
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
                            ) : loadError ? (
                                <div className="py-8 text-center">
                                    <p className="text-sm text-red-200">{loadError}</p>
                                    <button
                                        onClick={loadLibrary}
                                        className="mt-3 rounded-xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15 active:bg-white/20"
                                    >
                                        Thử lại
                                    </button>
                                </div>
                            ) : filtered.length === 0 ? (
                                <div className="text-center text-white/50 py-8">
                                    {search.trim()
                                        ? "Không tìm thấy thực phẩm."
                                        : "Thư viện trống, hãy thêm vào trong Cài đặt."}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filtered.map((item) => (
                                        <button
                                            key={item.id}
                                            onClick={() => handleSelectFood(item)}
                                            className="w-full flex items-center justify-between gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 active:bg-white/15 transition-colors text-left"
                                        >
                                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-white/10">
                                                    {item.thumbnail_base64 ? (
                                                        <img
                                                            src={item.thumbnail_base64}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full w-full items-center justify-center text-white/30">
                                                            <ImageIcon size={18} />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="truncate text-white font-medium">{item.name}</div>
                                                    <div className="text-xs text-white/40">
                                                        {item.calories} kcal • P: {item.protein}g • C:{" "}
                                                        {item.carbs}g • F: {item.fat}g
                                                    </div>
                                                </div>
                                            </div>
                                            <ChevronDown
                                                size={18}
                                                className="text-white/30 -rotate-90"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    /* Giao diện nhập số lượng sau khi đã chọn thực phẩm (cả thêm và sửa) */
                    <div className="flex-1 flex flex-col">
                        {/* Tên thực phẩm đã chọn */}
                        <div className="mb-4 p-3 bg-white/5 rounded-xl flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-3">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                                    {selectedFood?.thumbnailBase64 ? (
                                        <img
                                            src={selectedFood.thumbnailBase64}
                                            alt={selectedFood.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-white/30">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate text-white font-medium">
                                        {selectedFood?.name}
                                    </div>
                                    <div className="text-xs text-white/40">
                                        Mỗi {selectedFood?.baseQuantity}
                                        {selectedFood?.unit}: {selectedFood?.baseCalories} kcal
                                    </div>
                                </div>
                            </div>
                            {/* Khi sửa, không cho phép đổi món (có thể bỏ nếu muốn) */}
                            {!isEditing && (
                                <button
                                    onClick={() => setShowPicker(true)}
                                    className="text-indigo-400 text-sm font-medium"
                                >
                                    Đổi
                                </button>
                            )}
                        </div>

                        {/* Nhập số lượng & đơn vị */}
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">
                                    Số lượng
                                </label>
                                <input
                                    type="number"
                                    inputMode="decimal"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-lg focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                            <div>
                                <label className="text-xs text-white/50 mb-1 block">
                                    Đơn vị
                                </label>
                                <input
                                    type="text"
                                    value={unit}
                                    onChange={(e) => setUnit(e.target.value)}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-lg focus:outline-none focus:border-indigo-500/50"
                                />
                            </div>
                        </div>

                        {/* Macro tính toán */}
                        {selectedFood &&
                            (() => {
                                const qty = parseFloat(quantity) || 0;
                                const macros = calculateMacros(selectedFood, qty);
                                return (
                                    <div className="bg-white/5 rounded-xl p-4 mb-6">
                                        <h3 className="text-white/70 text-sm mb-2">
                                            Thông tin dinh dưỡng dự kiến
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div className="text-white/60">Calories</div>
                                            <div className="text-white font-medium text-right">
                                                {macros.calories} kcal
                                            </div>
                                            <div className="text-white/60">Đạm (Protein)</div>
                                            <div className="text-white text-right">
                                                {macros.protein}g
                                            </div>
                                            <div className="text-white/60">Tinh bột (Carbs)</div>
                                            <div className="text-white text-right">
                                                {macros.carbs}g
                                            </div>
                                            <div className="text-white/60">Chất béo (Fat)</div>
                                            <div className="text-white text-right">
                                                {macros.fat}g
                                            </div>
                                        </div>
                                    </div>
                                );
                            })()}

                        {/* Nút lưu */}
                        <button
                            onClick={handleSave}
                            disabled={!selectedFood || parseFloat(quantity) <= 0}
                            className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl font-semibold text-white transition-colors disabled:opacity-50 mt-auto"
                        >
                            {isEditing ? "Cập nhật" : "Thêm vào thực đơn"}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
