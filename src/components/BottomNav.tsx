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
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-slate-950/90 backdrop-blur-xl">
      <div 
        className="flex items-center px-1"
        style={{ 
          height: "3.5rem",
          paddingBottom: "env(safe-area-inset-bottom)",
          boxSizing: "content-box"
        }}
      >
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(`${item.href}/`));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center h-full space-y-1 transition-colors ${
                isActive ? "text-indigo-400" : "text-white/40 hover:text-white/60 active:text-white/70"
              }`}
            >
              <Icon className={`w-[22px] h-[22px] ${isActive ? "drop-shadow-[0_0_8px_rgba(129,140,248,0.5)]" : ""}`} />
              <span className="text-[10px] font-medium leading-none">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
