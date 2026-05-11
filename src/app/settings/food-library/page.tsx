"use client";
import { useEffect, useState, useCallback } from "react";
import { ImageIcon, Plus, Edit2, Trash2, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import {
    getFoodLibrary,
    addFoodLibraryItem,
    updateFoodLibraryItem,
    deleteFoodLibraryItem,
} from "@/lib/food-library";
import { FoodLibraryItem, FoodLibraryItemInsert } from "@/types/food-library";
import FoodLibraryForm from "@/components/FoodLibraryForm";

export default function FoodLibraryPage() {
    const [user, setUser] = useState<User | null>(null); // FIX 1
    const [items, setItems] = useState<FoodLibraryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<FoodLibraryItem | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    // Auth
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
        });
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_e, s) => setUser(s?.user ?? null)
        );
        return () => subscription.unsubscribe();
    }, []);

    // Load data
    const loadData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const data = await getFoodLibrary();
            setItems(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // Handlers
    const handleAdd = async (item: FoodLibraryItemInsert) => {
        const newItem = await addFoodLibraryItem(item);
        setItems((prev) => [...prev, newItem]);
        setShowForm(false);
    };

    const handleUpdate = async (id: string, updates: Partial<FoodLibraryItemInsert>) => {
        const updated = await updateFoodLibraryItem(id, updates);
        setItems((prev) => prev.map((i) => (i.id === id ? updated : i)));
        setEditItem(null);
        setShowForm(false);
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteFoodLibraryItem(id);
            setItems((prev) => prev.filter((i) => i.id !== id));
        } finally {
            setDeletingId(null);
        }
    };

    const filtered = items.filter((i) =>
        i.name.toLowerCase().includes(search.toLowerCase())
    );

    // FIX 2: Tạo hàm onSave duy nhất
    const handleSave = editItem
        ? async (item: FoodLibraryItemInsert) => {
            await handleUpdate(editItem.id, item);
        }
        : handleAdd;

    if (!user) {
        return (
            <div className="flex flex-col items-center justify-center h-screen text-white">
                <p>Vui lòng đăng nhập để sử dụng Thư viện thực phẩm.</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white px-4 pt-12 pb-24">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Thư viện thực phẩm</h1>
                <button
                    onClick={() => {
                        setEditItem(null);
                        setShowForm(true);
                    }}
                    className="p-2 bg-indigo-500 rounded-xl hover:bg-indigo-600 active:bg-indigo-700"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Search */}
            <div className="relative mb-4">
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30"
                />
                <input
                    type="text"
                    placeholder="Tìm kiếm thực phẩm..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-indigo-500/50"
                />
            </div>

            {/* List */}
            {loading ? (
                <div className="text-center text-white/50">Đang tải...</div>
            ) : filtered.length === 0 ? (
                <div className="text-center text-white/50">Chưa có thực phẩm nào.</div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 p-3 bg-white/5 rounded-xl"
                        >
                            <div className="flex min-w-0 flex-1 items-center gap-3">
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-white/10">
                                    {item.thumbnail_base64 ? (
                                        <img
                                            src={item.thumbnail_base64}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-full w-full items-center justify-center text-white/30">
                                            <ImageIcon size={20} />
                                        </div>
                                    )}
                                </div>
                                <div className="min-w-0">
                                    <div className="truncate font-medium">{item.name}</div>
                                    <div className="text-xs text-white/50">
                                        {item.calories} kcal | P: {item.protein}g | C: {item.carbs}g | F:{" "}
                                        {item.fat}g
                                    </div>
                                </div>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <button
                                    onClick={() => {
                                        setEditItem(item);
                                        setShowForm(true);
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-lg"
                                >
                                    <Edit2 size={16} />
                                </button>
                                <button
                                    onClick={() => handleDelete(item.id)}
                                    disabled={deletingId === item.id}
                                    className="p-2 hover:bg-white/10 rounded-lg text-red-400"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal Form */}
            {showForm && (
                <FoodLibraryForm
                    editItem={editItem}
                    onSave={handleSave}  // FIX 2: dùng hàm thống nhất
                    onClose={() => {
                        setShowForm(false);
                        setEditItem(null);
                    }}
                />
            )}
        </div>
    );
}
