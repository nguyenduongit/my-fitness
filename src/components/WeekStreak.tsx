"use client";

import { DayOfWeek, DAY_LABELS } from "@/types/schedule";

interface WeekStreakProps {
    /** Days that have workout sessions (non-rest) */
    activeDays: DayOfWeek[];
    /** Today's day of week */
    today: DayOfWeek;
}

export default function WeekStreak({ activeDays, today }: WeekStreakProps) {
    // Mon-Sun order
    const orderedDays: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];

    return (
        <div className="flex items-center justify-between gap-1">
            {orderedDays.map((dow) => {
                const isActive = activeDays.includes(dow);
                const isToday = dow === today;

                return (
                    <div
                        key={dow}
                        className="flex flex-col items-center gap-1.5 flex-1"
                    >
                        <span
                            className={`text-[10px] font-medium ${isToday ? "text-indigo-400" : "text-white/30"
                                }`}
                        >
                            {DAY_LABELS[dow]}
                        </span>
                        <div
                            className={`
                                w-8 h-8 rounded-full flex items-center justify-center
                                transition-all duration-500
                                ${isActive && isToday
                                    ? "bg-gradient-to-br from-indigo-500 to-cyan-500 shadow-[0_0_12px_rgba(99,102,241,0.5)]"
                                    : isActive
                                        ? "bg-gradient-to-br from-indigo-500/40 to-cyan-500/30 border border-indigo-500/20"
                                        : isToday
                                            ? "bg-white/10 border-2 border-indigo-500/40"
                                            : "bg-white/5 border border-white/5"
                                }
                            `}
                        >
                            {isActive ? (
                                <span className="text-xs">🏋️</span>
                            ) : (
                                <span className="text-[10px] text-white/20">—</span>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
