"use client";

import { useState, useRef, useEffect } from "react";
import { Plus, Trash2, Check, Edit2, ImageIcon } from "lucide-react";
import {
    MealPlanItem,
    MealType,
    MEAL_LABELS,
    MEAL_ICONS,
} from "@/types/meal-plan";

interface MealBlockProps {
    mealType: MealType;
    items: MealPlanItem[];
    isToday?: boolean;
    isCompleted?: boolean;
    isToggling?: boolean;
    deletingId?: string | null;
    onToggleCompletion?: (mealType: MealType) => void;
    onAddFood?: (mealType: MealType) => void;
    onDeleteFood?: (id: string) => void;
    onEditFood?: (item: MealPlanItem) => void;
}

function SwipeableFoodItem({
    item,
    isCompleted,
    onDelete,
    onEdit,
    deletingId
}: {
    item: MealPlanItem;
    isCompleted: boolean;
    onDelete?: (id: string) => void;
    onEdit?: (item: MealPlanItem) => void;
    deletingId?: string | null;
}) {
    const [offset, setOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startX = useRef(0);
    const currentX = useRef(0);

    const maxSwipe = 140; // 70px per button (Edit + Delete)

    const handleTouchStart = (e: React.TouchEvent) => {
        startX.current = e.touches[0].clientX;
        currentX.current = offset;
        setIsDragging(true);
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (!isDragging) return;
        const diff = e.touches[0].clientX - startX.current;
        let newOffset = currentX.current + diff;
        
        // Prevent swiping right (positive offset)
        if (newOffset > 0) newOffset = 0;
        // Add resistance if swiping past the maxSwipe distance
        if (newOffset < -maxSwipe) {
            newOffset = -maxSwipe - Math.sqrt(-newOffset - maxSwipe);
        }
        
        setOffset(newOffset);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        // Snap open if dragged more than half of maxSwipe
        if (offset < -maxSwipe / 2) {
            setOffset(-maxSwipe);
        } else {
            setOffset(0);
        }
    };

    // Close swipe when completed or deleting
    useEffect(() => {
        if (isCompleted || deletingId === item.id) {
            setOffset(0);
        }
    }, [isCompleted, deletingId, item.id]);

    const isDeleting = deletingId === item.id;

    return (
        <div className="relative overflow-hidden border-t border-white/5 first:border-t-0 bg-[#1C1C1E]">
            {/* Background Actions (Edit & Delete) */}
            <div className="absolute inset-y-0 right-0 flex items-center justify-end w-[140px]">
                <button 
                    onClick={() => {
                        setOffset(0);
                        onEdit?.(item);
                    }}
                    className="flex-1 h-full flex flex-col items-center justify-center bg-blue-500 text-white active:bg-blue-600 transition-colors"
                >
                    <Edit2 className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Sửa</span>
                </button>
                <button 
                    onClick={() => {
                        setOffset(0);
                        onDelete?.(item.id);
                    }}
                    disabled={isDeleting}
                    className="flex-1 h-full flex flex-col items-center justify-center bg-red-500 text-white active:bg-red-600 transition-colors disabled:opacity-50"
                >
                    <Trash2 className="w-5 h-5 mb-1" />
                    <span className="text-[10px] font-medium">Xóa</span>
                </button>
            </div>
            
            {/* Foreground Content */}
            <div 
                className={`relative flex items-center p-3.5 bg-[#1C1C1E] ${!isDragging ? 'transition-transform duration-300 ease-out' : ''} ${isDeleting ? 'opacity-50' : ''}`}
                style={{ transform: `translateX(${offset}px)` }}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                {/* Square Image */}
                <div className="w-14 h-14 rounded-xl shrink-0 overflow-hidden mr-3.5 bg-white/5">
                    {item.thumbnail_base64 ? (
                        <img
                            src={item.thumbnail_base64}
                            alt={item.name}
                            className={`w-full h-full object-cover ${isCompleted ? 'grayscale opacity-60' : ''}`}
                        />
                    ) : (
                        <div className={`flex h-full w-full items-center justify-center text-white/30 ${isCompleted ? 'opacity-50' : ''}`}>
                            <ImageIcon className="h-5 w-5" />
                        </div>
                    )}
                </div>
                
                {/* Content */}
                <div className="flex-1 min-w-0 py-0.5">
                    {/* Top line: Name and Calories */}
                    <div className="flex items-start justify-between mb-1.5 gap-2">
                        <p className={`text-[15px] font-medium truncate ${isCompleted ? 'text-white/50 line-through' : 'text-white'}`}>
                            {item.name}
                        </p>
                        <p className={`text-[15px] font-bold shrink-0 ${isCompleted ? 'text-amber-400/50' : 'text-amber-400'}`}>
                            {Math.round(item.calories)} <span className="text-xs font-normal">kcal</span>
                        </p>
                    </div>
                    
                    {/* Bottom line: Macros and Quantity */}
                    <div className={`flex items-center text-[13px] ${isCompleted ? 'text-white/30' : 'text-white/50'}`}>
                        <span className="mr-2 px-1.5 py-0.5 rounded bg-white/10 text-[11px] font-medium text-white/70 flex-shrink-0">
                            {item.quantity} {item.unit}
                        </span>
                        <div className="flex items-center gap-2.5 truncate">
                            <span>P: <span className={isCompleted ? 'text-white/40' : 'text-white/80'}>{Math.round(item.protein)}g</span></span>
                            <span>C: <span className={isCompleted ? 'text-white/40' : 'text-white/80'}>{Math.round(item.carbs)}g</span></span>
                            <span>F: <span className={isCompleted ? 'text-white/40' : 'text-white/80'}>{Math.round(item.fat)}g</span></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function MealBlock({
    mealType,
    items,
    isToday = false,
    isCompleted = false,
    isToggling = false,
    deletingId = null,
    onToggleCompletion,
    onAddFood,
    onDeleteFood,
    onEditFood,
}: MealBlockProps) {
    const totalCals = items.reduce((s, i) => s + i.calories, 0);
    const totalProtein = items.reduce((s, i) => s + i.protein, 0);
    const totalCarbs = items.reduce((s, i) => s + i.carbs, 0);
    const totalFat = items.reduce((s, i) => s + i.fat, 0);
    const hasFood = items.length > 0;

    return (
        <section className="mb-6 rounded-[24px] border border-white/10 bg-[#1C1C1E] overflow-hidden shadow-lg">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-white/5">
                <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10 text-xl">
                        {MEAL_ICONS[mealType]}
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-white mb-0.5">{MEAL_LABELS[mealType]}</h3>
                        <div className="text-xs text-white/50 flex items-center gap-1.5">
                            <span className="font-semibold text-amber-400">{Math.round(totalCals)} kcal</span>
                            <span>·</span>
                            <span>P: {Math.round(totalProtein)}g</span>
                            <span>C: {Math.round(totalCarbs)}g</span>
                            <span>F: {Math.round(totalFat)}g</span>
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-3">
                    {/* Check icon (only for today & has food) */}
                    {isToday && hasFood && onToggleCompletion && (
                        <button
                            onClick={() => onToggleCompletion(mealType)}
                            disabled={isToggling}
                            className="p-2 transition-all active:scale-90"
                            title={isCompleted ? "Đã xong" : "Đánh dấu"}
                        >
                            <Check 
                                className={`w-7 h-7 transition-colors ${
                                    isCompleted 
                                        ? "text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" 
                                        : "text-white/20 hover:text-white/40"
                                } ${isToggling ? "opacity-50" : ""}`} 
                            />
                        </button>
                    )}
                    
                    {/* Plus icon to add food */}
                    {onAddFood && (
                        <button
                            onClick={() => onAddFood(mealType)}
                            className="flex items-center justify-center w-8 h-8 rounded-full bg-indigo-500/20 text-indigo-400 active:bg-indigo-500/30 transition-colors"
                            title="Thêm thực phẩm"
                        >
                            <Plus className="w-5 h-5" />
                        </button>
                    )}
                </div>
            </div>

            {/* Food Items List */}
            <div className="flex flex-col">
                {!hasFood ? (
                    <div className="p-6 text-center">
                        <p className="text-sm text-white/30 italic">Chưa có thực phẩm nào</p>
                        {onAddFood && (
                            <button 
                                onClick={() => onAddFood(mealType)}
                                className="mt-3 text-xs font-medium text-indigo-400 bg-indigo-500/10 px-4 py-2 rounded-full active:bg-indigo-500/20 transition-colors"
                            >
                                Thêm thực phẩm ngay
                            </button>
                        )}
                    </div>
                ) : (
                    items.map((item) => (
                        <SwipeableFoodItem
                            key={item.id}
                            item={item}
                            isCompleted={isCompleted}
                            onDelete={onDeleteFood}
                            onEdit={onEditFood}
                            deletingId={deletingId}
                        />
                    ))
                )}
            </div>
        </section>
    );
}
