"use client";

import { useEffect, useState } from "react";

interface CalorieRingProps {
    consumed: number;
    goal: number;
    size?: number;
}

export default function CalorieRing({ consumed, goal, size = 160 }: CalorieRingProps) {
    const [animatedPercent, setAnimatedPercent] = useState(0);
    const percent = Math.min(consumed / goal, 1.2); // allow slight overflow visually
    const remaining = Math.max(goal - consumed, 0);

    const strokeWidth = 12;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - animatedPercent);

    const isOver = consumed > goal;
    const gradientId = "calorie-gradient";

    useEffect(() => {
        // Animate on mount
        const timer = setTimeout(() => setAnimatedPercent(Math.min(percent, 1)), 100);
        return () => clearTimeout(timer);
    }, [percent]);

    return (
        <div className="relative" style={{ width: size, height: size }}>
            <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#818cf8" />
                        <stop offset="50%" stopColor="#6366f1" />
                        <stop offset="100%" stopColor="#22d3ee" />
                    </linearGradient>
                    <linearGradient id="calorie-gradient-over" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#fb923c" />
                    </linearGradient>
                </defs>
                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={isOver ? `url(#calorie-gradient-over)` : `url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    style={{
                        transition: "stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        filter: "drop-shadow(0 0 6px rgba(99, 102, 241, 0.4))",
                    }}
                />
            </svg>
            {/* Center label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-xs text-white/40 font-medium">
                    {isOver ? "Vượt mức" : "Còn lại"}
                </span>
                <span
                    className={`text-3xl font-bold tracking-tight ${isOver ? "text-red-400" : "text-white"}`}
                >
                    {isOver
                        ? `+${(consumed - goal).toLocaleString()}`
                        : remaining.toLocaleString()}
                </span>
                <span className="text-[10px] text-white/30 mt-0.5">kcal</span>
            </div>
        </div>
    );
}
