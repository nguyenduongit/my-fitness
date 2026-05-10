"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import NotificationPermission from "@/components/NotificationPermission";
import { registerServiceWorker } from "@/lib/push.utils";

/**
 * Welcome Page
 *
 * The main (and only) screen of the PWA template.
 * Features:
 * - Animated gradient background
 * - App icon with glow effect
 * - Welcome message
 * - "Start exploring" CTA button
 * - Notification permission + test section
 */

const APP_NAME = "My Fitness";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [swReady, setSwReady] = useState(false);

  // Register service worker on mount
  useEffect(() => {
    setMounted(true);

    registerServiceWorker().then((reg) => {
      if (reg) setSwReady(true);
    });
  }, []);

  return (
    <main
      className={`relative h-screen h-dvh flex flex-col items-center justify-center px-6
        bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950
        overflow-y-auto transition-opacity duration-1000
        ${mounted ? "opacity-100" : "opacity-0"}`}
      style={{
        paddingTop: "max(3rem, env(safe-area-inset-top, 0px))",
        paddingBottom: "max(3rem, env(safe-area-inset-bottom, 0px))",
        paddingLeft: "max(1.5rem, env(safe-area-inset-left, 0px))",
        paddingRight: "max(1.5rem, env(safe-area-inset-right, 0px))",
      }}
    >
      {/* ── Animated background orbs ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        <div className="absolute -top-40 -left-40 w-80 h-80 rounded-full bg-indigo-500/20 blur-[100px] animate-pulse" />
        <div className="absolute top-1/3 -right-20 w-96 h-96 rounded-full bg-cyan-500/15 blur-[120px] animate-pulse [animation-delay:1s]" />
        <div className="absolute -bottom-32 left-1/3 w-72 h-72 rounded-full bg-violet-500/15 blur-[100px] animate-pulse [animation-delay:2s]" />
      </div>

      {/* ── Grid overlay ── */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        aria-hidden="true"
        style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* ── Content ── */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg w-full">
        {/* App icon with glow */}
        <div className="relative group">
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-indigo-500 to-cyan-500 blur-2xl opacity-40 group-hover:opacity-60 group-active:opacity-60 transition-opacity duration-500" />
          <div className="relative w-28 h-28 rounded-3xl overflow-hidden border-2 border-white/10 shadow-2xl">
            <Image
              src="/icons/icon-512x512.png"
              alt={`${APP_NAME} icon`}
              fill
              sizes="112px"
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Welcome heading */}
        <div className="text-center space-y-3">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            <span className="bg-gradient-to-r from-white via-white to-white/60 bg-clip-text text-transparent">
              Welcome to{" "}
            </span>
            <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              {APP_NAME}
            </span>
          </h1>
          <p className="text-white/50 text-base sm:text-lg max-w-sm mx-auto leading-relaxed">
            Your personal fitness companion. Track your workouts and stay healthy.
          </p>
        </div>

        {/* Start exploring button */}
        <button
          className="relative group px-8 py-3.5 min-h-[44px] rounded-2xl font-semibold text-base
            overflow-hidden
            text-white
            transition-all duration-300
            hover:-translate-y-0.5 active:scale-[0.98]
            shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30
            active:shadow-lg active:shadow-indigo-500/25"
          id="btn-start-exploring"
          onClick={() => alert("🚀 Let's build something amazing!")}
        >
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 transition-opacity duration-300" />
          {/* Shimmer effect on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <span className="relative z-10 flex items-center gap-2">
            Start Exploring
            <svg className="w-5 h-5 group-hover:translate-x-1 group-active:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </span>
        </button>

        {/* Divider */}
        <div className="w-full flex items-center gap-4 my-2">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent to-white/10" />
          <span className="text-white/30 text-xs font-medium tracking-widest uppercase">Notifications</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent to-white/10" />
        </div>

        {/* Notification permission component */}
        <NotificationPermission />

        {/* Service worker status */}
        <div className="mt-4 flex items-center gap-2 text-xs text-white/30">
          <span
            className={`inline-block w-1.5 h-1.5 rounded-full ${
              swReady ? "bg-emerald-400" : "bg-white/20"
            }`}
          />
          Service Worker: {swReady ? "Active" : "Registering..."}
        </div>
      </div>

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-16 text-center text-white/20 text-xs">
        <p>
          Built with{" "}
          <a
            href="https://nextjs.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/60 active:text-white/70 underline underline-offset-2 transition-colors"
          >
            Next.js
          </a>{" "}
          &middot; My Fitness
        </p>
      </footer>
    </main>
  );
}
