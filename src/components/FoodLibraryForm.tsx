"use client";
import { useState } from "react";
import { ImagePlus, Trash2, X } from "lucide-react";
import { FoodLibraryItem, FoodLibraryItemInsert } from "@/types/food-library";

interface FoodLibraryFormProps {
    editItem?: FoodLibraryItem | null;
    onSave: (item: FoodLibraryItemInsert) => Promise<void>;
    onClose: () => void;
}

function getErrorMessage(error: unknown) {
    if (error instanceof Error) return error.message;

    if (error && typeof error === "object" && "message" in error) {
        const message = (error as { message?: unknown }).message;
        if (typeof message === "string") return message;
    }

    return "Không thể lưu thực phẩm. Vui lòng thử lại.";
}

function compressImageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject(new Error("Vui lòng chọn một file ảnh."));
            return;
        }

        const reader = new FileReader();
        reader.onerror = () => reject(new Error("Không thể đọc file ảnh."));
        reader.onload = () => {
            const image = new Image();
            image.onerror = () => reject(new Error("Không thể xử lý ảnh này."));
            image.onload = () => {
                const maxSize = 512;
                const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
                const width = Math.max(1, Math.round(image.width * scale));
                const height = Math.max(1, Math.round(image.height * scale));
                const canvas = document.createElement("canvas");
                const context = canvas.getContext("2d");

                if (!context) {
                    reject(new Error("Trình duyệt không hỗ trợ nén ảnh."));
                    return;
                }

                canvas.width = width;
                canvas.height = height;
                context.fillStyle = "#ffffff";
                context.fillRect(0, 0, width, height);
                context.drawImage(image, 0, 0, width, height);
                resolve(canvas.toDataURL("image/jpeg", 0.82));
            };

            if (typeof reader.result === "string") {
                image.src = reader.result;
            } else {
                reject(new Error("Không thể đọc file ảnh."));
            }
        };
        reader.readAsDataURL(file);
    });
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
        thumbnail_base64: editItem?.thumbnail_base64 || "",
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
    const [imageLoading, setImageLoading] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (key: string, value: string) => {
        setForm((prev) => ({ ...prev, [key]: value }));
    };

    const handleImageChange = async (file: File | undefined) => {
        if (!file) return;
        setImageLoading(true);
        setError("");
        try {
            const thumbnail = await compressImageToBase64(file);
            handleChange("thumbnail_base64", thumbnail);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setImageLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!form.name || !form.calories) return;
        setLoading(true);
        setError("");
        try {
            const payload: FoodLibraryItemInsert = {
                name: form.name,
                calories: Number(form.calories),
                protein: Number(form.protein) || 0,
                carbs: Number(form.carbs) || 0,
                fat: Number(form.fat) || 0,
                thumbnail_base64: form.thumbnail_base64 || null,
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
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm"
            style={{
                paddingBottom: "calc(5.5rem + env(safe-area-inset-bottom, 0px))",
                paddingTop: "env(safe-area-inset-top, 0px)",
            }}
        >
            <div
                className="w-full max-w-md bg-zinc-900 rounded-t-3xl p-6 animate-slide-up flex max-h-[calc(100dvh-7rem)] flex-col"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">
                        {editItem ? "Sửa thực phẩm" : "Thêm thực phẩm"}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-xl">
                        <X size={20} />
                    </button>
                </div>

                <div className="min-h-0 flex-1 space-y-3 overflow-y-auto">
                    {/* Macro cơ bản */}
                    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3">
                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white/10">
                            {form.thumbnail_base64 ? (
                                <img
                                    src={form.thumbnail_base64}
                                    alt={form.name || "Ảnh thực phẩm"}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-white/30">
                                    <ImagePlus size={24} />
                                </div>
                            )}
                        </div>
                        <div className="min-w-0 flex-1">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-medium text-white hover:bg-white/15 active:bg-white/20">
                                <ImagePlus size={16} />
                                {imageLoading ? "Đang nén..." : "Chọn ảnh"}
                                <input
                                    type="file"
                                    accept="image/*"
                                    disabled={imageLoading}
                                    onChange={(e) => {
                                        void handleImageChange(e.target.files?.[0]);
                                        e.target.value = "";
                                    }}
                                    className="sr-only"
                                />
                            </label>
                            {form.thumbnail_base64 && (
                                <button
                                    type="button"
                                    onClick={() => handleChange("thumbnail_base64", "")}
                                    className="ml-2 inline-flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium text-red-300 hover:bg-red-500/10 active:bg-red-500/15"
                                >
                                    <Trash2 size={15} />
                                    Xóa
                                </button>
                            )}
                            <p className="mt-2 text-xs text-white/40">
                                Ảnh sẽ được nén về tối đa 512px trước khi lưu.
                            </p>
                        </div>
                    </div>

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

                {error && (
                    <p className="mt-3 rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                        {error}
                    </p>
                )}

                <button
                    onClick={handleSubmit}
                    disabled={loading || imageLoading || !form.name || !form.calories}
                    className="w-full mt-4 shrink-0 py-3 bg-indigo-500 hover:bg-indigo-600 active:bg-indigo-700 rounded-xl font-semibold text-white transition-colors disabled:opacity-50"
                >
                    {loading ? "Đang xử lý..." : editItem ? "Cập nhật" : "Thêm thực phẩm"}
                </button>
            </div>
        </div>
    );
}
