"use client";

interface MacroRingProps {
    label: string;
    value: number;
    max: number;
    color: string; // tailwind stroke color hex
    unit?: string;
}

export default function MacroRing({ label, value, max, color, unit = "g" }: MacroRingProps) {
    const percent = Math.min(value / max, 1);
    const radius = 22;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - percent);

    return (
        <div className="flex flex-col items-center gap-1">
            <div className="relative w-14 h-14">
                <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
                    {/* Background track */}
                    <circle
                        cx="28" cy="28" r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.07)"
                        strokeWidth="5"
                    />
                    {/* Progress */}
                    <circle
                        cx="28" cy="28" r={radius}
                        fill="none"
                        stroke={color}
                        strokeWidth="5"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        style={{ transition: "stroke-dashoffset 0.6s ease" }}
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-white/90">{Math.round(value)}</span>
                </div>
            </div>
            <div className="text-center">
                <p className="text-[10px] text-white/50">{label}</p>
                <p className="text-[10px] text-white/30">{max}{unit}</p>
            </div>
        </div>
    );
}