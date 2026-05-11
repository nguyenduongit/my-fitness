"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
    Bell,
    CalendarDays,
    ChevronRight,
    LogIn,
    LogOut,
    Target,
    UserRound,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { User } from "@supabase/supabase-js";

const settingItems = [
    {
        title: "Thông tin profile",
        description: "Tuổi, giới tính, chiều cao, cân nặng",
        href: "/settings/profile",
        icon: UserRound,
        iconClassName: "text-cyan-400 bg-cyan-500/10 border-cyan-500/15",
    },
    {
        title: "Mục tiêu dinh dưỡng",
        description: "Calories, macro và lượng nước mỗi ngày",
        href: "/settings/nutrition",
        icon: Target,
        iconClassName: "text-orange-400 bg-orange-500/10 border-orange-500/15",
    },
    {
        title: "Lịch tập luyện",
        description: "Ngày tập và ngày nghỉ trong tuần",
        href: "/settings/workout",
        icon: CalendarDays,
        iconClassName: "text-emerald-400 bg-emerald-500/10 border-emerald-500/15",
    },
    {
        title: "Lịch nhắc nhở",
        description: "Giờ ăn, giờ tập và thời gian nhắc lại",
        href: "/settings/reminders",
        icon: Bell,
        iconClassName: "text-amber-400 bg-amber-500/10 border-amber-500/15",
    },
];

export default function SettingsPage() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [signingOut, setSigningOut] = useState(false);

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogin = async () => {
        await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: window.location.origin + "/auth/callback",
            },
        });
    };

    const handleLogout = async () => {
        setSigningOut(true);
        try {
            await supabase.auth.signOut();
        } finally {
            setSigningOut(false);
        }
    };

    return (
        <main
            className="p-5 min-h-full flex flex-col"
            style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
        >
            <header className="mb-6">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                    Cài đặt
                </h1>
            </header>

            <div className="space-y-3">
                {settingItems.map((item) => {
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 active:bg-white/10 transition-colors backdrop-blur-md"
                        >
                            <span
                                className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${item.iconClassName}`}
                            >
                                <Icon className="w-5 h-5" />
                            </span>
                            <span className="min-w-0 flex-1">
                                <span className="block text-sm font-semibold text-white/90">
                                    {item.title}
                                </span>
                                <span className="mt-0.5 block truncate text-xs text-white/45">
                                    {item.description}
                                </span>
                            </span>
                            <ChevronRight className="w-4 h-4 text-white/35 shrink-0" />
                        </Link>
                    );
                })}
            </div>

            <div className="mt-auto pt-6">
                {loading ? (
                    <div className="flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 py-4">
                        <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : user ? (
                    <div className="flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 p-4 backdrop-blur-md">
                        <div className="w-11 h-11 rounded-xl bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center text-indigo-300 font-bold shrink-0">
                            {(user.user_metadata?.full_name || user.email || "U")
                                .charAt(0)
                                .toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-white/90">
                                {user.user_metadata?.full_name || user.email}
                            </p>
                            <p className="truncate text-xs text-white/45">{user.email}</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            disabled={signingOut}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 active:bg-red-500/20 transition-colors disabled:opacity-60 shrink-0"
                            title="Đăng xuất"
                        >
                            {signingOut ? (
                                <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <LogOut className="w-5 h-5" />
                            )}
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={handleLogin}
                        className="w-full flex items-center justify-center gap-2 rounded-2xl bg-white py-3 text-sm font-semibold text-slate-900 active:bg-gray-100 transition-colors"
                    >
                        <LogIn className="w-4 h-4" />
                        Đăng nhập với Google
                    </button>
                )}
            </div>
        </main>
    );
}
