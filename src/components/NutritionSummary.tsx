"use client";

import MacroRing from "./MacroRing";

interface NutritionSummaryProps {
    dayLabel?: string;
    totals: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    goal: {
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
    };
    className?: string;
}

export default function NutritionSummary({ dayLabel, totals, goal, className = "" }: NutritionSummaryProps) {
    const calPercent = goal.calories > 0 ? Math.min((totals.calories / goal.calories) * 100, 100) : 0;

    return (
        <div className={`p-5 rounded-3xl bg-gradient-to-br from-indigo-500/15 to-purple-500/10 border border-white/5 backdrop-blur-md ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    {dayLabel && <p className="text-xs text-white/40 mb-0.5">{dayLabel}</p>}
                    <p className="text-2xl font-bold text-white">
                        {totals.calories.toLocaleString()}
                        <span className="text-sm font-normal text-white/40 ml-1">kcal</span>
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-xs text-white/30 mb-0.5">Mục tiêu hàng ngày</p>
                    <p className="text-sm font-semibold text-white/60">
                        {goal.calories.toLocaleString()} <span className="text-[10px] font-normal opacity-60">kcal</span>
                    </p>
                </div>
            </div>

            {/* Calorie Progress Bar */}
            <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden mb-6">
                <div
                    className={`absolute inset-y-0 left-0 rounded-full transition-all duration-1000 ease-out ${
                        calPercent >= 100 
                        ? "bg-gradient-to-r from-red-500 to-orange-500" 
                        : "bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400"
                    }`}
                    style={{ width: `${calPercent}%` }}
                />
            </div>

            {/* Macro Rings Grid */}
            <div className="flex justify-around items-end pt-2">
                <MacroRing 
                    label="Đạm" 
                    value={totals.protein} 
                    max={goal.protein} 
                    color="#818cf8" 
                />
                <MacroRing 
                    label="Tinh bột" 
                    value={totals.carbs} 
                    max={goal.carbs} 
                    color="#22d3ee" 
                />
                <MacroRing 
                    label="Béo" 
                    value={totals.fat} 
                    max={goal.fat} 
                    color="#fb923c" 
                />
            </div>
        </div>
    );
}
