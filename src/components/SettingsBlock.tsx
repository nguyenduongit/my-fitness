"use client";

import { ReactNode, useState } from "react";
import { ChevronDown, LoaderCircle } from "lucide-react";

export interface SettingsSummaryItem {
    icon: ReactNode;
    label: string;
    value: ReactNode;
}

interface SettingsBlockProps {
    title: string;
    icon: ReactNode;
    summary: SettingsSummaryItem[];
    children: ReactNode;
    loading?: boolean;
    defaultExpanded?: boolean;
}

export default function SettingsBlock({
    title,
    icon,
    summary,
    children,
    loading = false,
    defaultExpanded = false,
}: SettingsBlockProps) {
    const [expanded, setExpanded] = useState(defaultExpanded);
    const visibleSummary = loading
        ? [{ icon: <LoaderCircle className="w-3.5 h-3.5 animate-spin" />, label: "Trạng thái", value: "Đang tải..." }]
        : summary;

    return (
        <section className="overflow-hidden rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <button
                type="button"
                onClick={() => setExpanded((prev) => !prev)}
                aria-expanded={expanded}
                className="w-full flex items-center gap-3 p-4 text-left active:bg-white/5 transition-colors"
            >
                <span className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center shrink-0">
                    {icon}
                </span>
                <span className="flex-1 min-w-0 font-semibold text-base text-white/90">
                    {title}
                </span>
                <ChevronDown
                    className={`w-4 h-4 text-white/35 shrink-0 transition-transform ${
                        expanded ? "rotate-180" : ""
                    }`}
                />
            </button>

            <div className="px-4 pb-4">
                {expanded ? (
                    loading ? (
                        <div className="flex justify-center py-6">
                            <div className="w-5 h-5 border-2 border-white/25 border-t-white/70 rounded-full animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-3">{children}</div>
                    )
                ) : (
                    <button
                        type="button"
                        onClick={() => setExpanded(true)}
                        className="w-full grid grid-cols-1 gap-2 text-left"
                    >
                        {visibleSummary.map((item, index) => (
                            <span
                                key={`${item.label}-${index}`}
                                className="flex items-center gap-2.5 rounded-xl bg-white/5 border border-white/5 px-3 py-2.5"
                            >
                                <span className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-sm text-white/60 shrink-0">
                                    {item.icon}
                                </span>
                                <span className="min-w-0 flex-1 text-xs text-white/45 truncate">
                                    {item.label}
                                </span>
                                <span className="max-w-[55%] text-right text-xs font-medium text-white/80 truncate">
                                    {item.value}
                                </span>
                            </span>
                        ))}
                    </button>
                )}
            </div>
        </section>
    );
}
