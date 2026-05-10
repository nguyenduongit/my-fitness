"use client";

import { useEffect, useState } from "react";
import { registerServiceWorker } from "@/lib/push.utils";

const APP_NAME = "My Fitness";

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [swReady, setSwReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    registerServiceWorker().then((reg) => {
      if (reg) setSwReady(true);
    });
  }, []);

  return (
    <main
      className={`p-6 min-h-full transition-opacity duration-500 ${
        mounted ? "opacity-100" : "opacity-0"
      }`}
      style={{
        paddingTop: "max(1.5rem, env(safe-area-inset-top, 0px))",
      }}
    >
      <header className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
            Chào mừng đến với{" "}
          </span>
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            {APP_NAME}
          </span>
        </h1>
        <p className="text-white/50 text-sm mt-2">
          Hôm nay là một ngày tuyệt vời để tập luyện!
        </p>
      </header>

      <section className="grid grid-cols-2 gap-4 mb-8">
        {/* Stat Card 1 */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-indigo-500/20 to-purple-500/10 border border-white/5 backdrop-blur-md">
          <p className="text-white/60 text-xs font-medium mb-1">Calories</p>
          <p className="text-2xl font-bold text-white">1,240</p>
          <p className="text-emerald-400 text-xs mt-1">Còn lại 760</p>
        </div>
        {/* Stat Card 2 */}
        <div className="p-4 rounded-3xl bg-gradient-to-br from-cyan-500/20 to-blue-500/10 border border-white/5 backdrop-blur-md">
          <p className="text-white/60 text-xs font-medium mb-1">Thời gian tập</p>
          <p className="text-2xl font-bold text-white">45<span className="text-sm font-normal text-white/50 ml-1">phút</span></p>
          <p className="text-emerald-400 text-xs mt-1">Hoàn thành mục tiêu</p>
        </div>
      </section>

      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white/90">Hoạt động hôm nay</h2>
          <button className="text-xs text-indigo-400 hover:text-indigo-300 font-medium">Xem tất cả</button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center mr-4">
              🔥
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white/90">Chạy bộ</h4>
              <p className="text-xs text-white/50">06:00 Sáng • 30 phút</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">320</p>
              <p className="text-xs text-white/50">kcal</p>
            </div>
          </div>

          <div className="flex items-center p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mr-4">
              🥗
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-medium text-white/90">Bữa sáng</h4>
              <p className="text-xs text-white/50">Yến mạch & Trái cây</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">450</p>
              <p className="text-xs text-white/50">kcal</p>
            </div>
          </div>
        </div>
      </section>

      {/* Service worker status */}
      <div className="mt-8 flex items-center justify-center gap-2 text-xs text-white/30">
        <span
          className={`inline-block w-1.5 h-1.5 rounded-full ${
            swReady ? "bg-emerald-400" : "bg-white/20"
          }`}
        />
        Service Worker: {swReady ? "Active" : "Registering..."}
      </div>
    </main>
  );
}
