"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Utensils, CalendarDays, Settings } from "lucide-react";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Thực đơn", href: "/menu", icon: Utensils },
  { name: "Lịch tập", href: "/schedule", icon: CalendarDays },
  { name: "Cài đặt", href: "/settings", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/80 backdrop-blur-xl"
      style={{ height: "calc(4.5rem + env(safe-area-inset-bottom))" }}
    >
      <div
        className="flex h-[4.5rem] items-center justify-around px-2"
      >
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? "text-indigo-400" : "text-white/40 hover:text-white/60 active:text-white/70"
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? "drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : ""}`} />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
