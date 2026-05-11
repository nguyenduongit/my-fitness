import { DayOfWeek, DAY_LABELS } from "@/types/schedule";

interface DaySelectorProps {
    selectedDay: DayOfWeek;
    onSelectDay: (day: DayOfWeek) => void;
}

const ORDERED_DAYS: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0]; // T2 → CN

export default function DaySelector({ selectedDay, onSelectDay }: DaySelectorProps) {
    const todayDow = new Date().getDay() as DayOfWeek;

    return (
        <div className="flex items-center justify-between bg-white/5 p-2 rounded-2xl border border-white/5">
            {ORDERED_DAYS.map((dow) => {
                const isSelected = dow === selectedDay;
                const isDayToday = dow === todayDow;

                return (
                    <button
                        key={dow}
                        onClick={() => onSelectDay(dow)}
                        className={`relative flex flex-col items-center justify-center w-[13%] py-2.5 rounded-xl transition-all ${
                            isSelected
                                ? "bg-indigo-500 shadow-lg shadow-indigo-500/25 scale-105"
                                : "active:bg-white/10"
                        }`}
                    >
                        <span
                            className={`text-sm font-bold ${
                                isSelected ? "text-white" : isDayToday ? "text-indigo-400" : "text-white/70"
                            }`}
                        >
                            {DAY_LABELS[dow]}
                        </span>
                        {isDayToday && !isSelected && (
                            <div className="w-1 h-1 rounded-full bg-indigo-400 absolute bottom-1" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
