"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, LogIn, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  getWorkoutSessions,
  createWorkoutSession,
  updateWorkoutSession,
  deleteWorkoutSession,
} from "@/lib/schedule";
import {
  WorkoutSession,
  WorkoutSessionInsert,
  DayOfWeek,
  DAY_FULL_LABELS,
} from "@/types/schedule";
import WorkoutCard from "@/components/WorkoutCard";
import WorkoutFormModal from "@/components/WorkoutFormModal";
import { User } from "@supabase/supabase-js";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getCurrentDayOfWeek(): DayOfWeek {
  return new Date().getDay() as DayOfWeek;
}

export default function SchedulePage() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [sessions, setSessions] = useState<WorkoutSession[]>([]);
  const [dataLoading, setDataLoading] = useState(false);

  const [activeWeek, setActiveWeek] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [editingSession, setEditingSession] = useState<WorkoutSession | undefined>();

  const todayDow = getCurrentDayOfWeek();

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!user) return;
    setDataLoading(true);
    try {
      const data = await getWorkoutSessions();
      setSessions(data);
    } finally {
      setDataLoading(false);
    }
  }, [user]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  // ─── Actions ────────────────────────────────────────────────────────────────

  const handleSave = async (data: WorkoutSessionInsert) => {
    if (editingSession) {
      const updated = await updateWorkoutSession(editingSession.id, data);
      setSessions((prev) => prev.map((s) => s.id === updated.id ? updated : s));
    } else {
      const created = await createWorkoutSession(data);
      setSessions((prev) => [...prev, created]);
    }
    setEditingSession(undefined);
    setShowModal(false);
  };

  const handleDelete = async (id: string) => {
    await deleteWorkoutSession(id);
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  const handleEdit = (session: WorkoutSession) => {
    setEditingSession(session);
    setShowModal(true);
  };

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/auth/callback" },
    });
  };

  // ─── Derived ─────────────────────────────────────────────────────────────────

  const weekSessions = sessions.filter((s) => s.week_number === activeWeek);
  const totalWeeks = sessions.length > 0
    ? Math.max(...sessions.map((s) => s.week_number))
    : 1;

  // Sort by day of week (Mon first)
  const orderedDays: DayOfWeek[] = [1, 2, 3, 4, 5, 6, 0];
  const sortedSessions = [...weekSessions].sort(
    (a, b) => orderedDays.indexOf(a.day_of_week) - orderedDays.indexOf(b.day_of_week)
  );

  // Weekly stats
  const workoutDays = weekSessions.filter((s) => !s.is_rest_day).length;
  const totalExercises = weekSessions.reduce((s, ws) => s + ws.exercises.length, 0);
  const totalSets = weekSessions.reduce(
    (s, ws) => s + ws.exercises.reduce((es, e) => es + e.sets.length, 0),
    0
  );

  // ─── Not logged in ───────────────────────────────────────────────────────────

  if (!authLoading && !user) {
    return (
      <main className="p-6 min-h-full flex flex-col items-center justify-center gap-6">
        <div className="text-center">
          <p className="text-5xl mb-4">🏋️</p>
          <h2 className="text-xl font-bold text-white/90 mb-2">Lịch tập luyện</h2>
          <p className="text-sm text-white/50">Đăng nhập để tạo và theo dõi lịch tập của bạn</p>
        </div>
        <button
          onClick={handleLogin}
          className="flex items-center gap-2 px-6 py-3.5 bg-white rounded-2xl text-slate-900 font-semibold active:scale-95 transition-transform"
        >
          <LogIn className="w-5 h-5" />
          Đăng nhập với Google
        </button>
      </main>
    );
  }

  return (
    <main
      className="p-5 min-h-full"
      style={{ paddingTop: "max(1.25rem, env(safe-area-inset-top, 0px))" }}
    >
      {/* Header */}
      <header className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
          Lịch tập
        </h1>
        <button
          onClick={() => { setEditingSession(undefined); setShowModal(true); }}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-sm font-medium active:bg-indigo-500/30 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Thêm
        </button>
      </header>

      {/* Week navigator */}
      <div className="flex items-center justify-between mb-4 p-3 rounded-2xl bg-white/5 border border-white/5">
        <button
          onClick={() => setActiveWeek((w) => Math.max(1, w - 1))}
          disabled={activeWeek <= 1}
          className="p-2 rounded-xl bg-white/5 active:bg-white/15 transition-colors disabled:opacity-30"
        >
          <ChevronLeft className="w-4 h-4 text-white/60" />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/90">Tuần {activeWeek}</p>
          <p className="text-xs text-white/30">{workoutDays} ngày tập</p>
        </div>
        <button
          onClick={() => setActiveWeek((w) => w + 1)}
          className="p-2 rounded-xl bg-white/5 active:bg-white/15 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-white/60" />
        </button>
      </div>

      {/* Week stats */}
      {weekSessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: "Ngày tập", value: workoutDays, unit: "ngày", color: "from-indigo-500/20 to-indigo-500/5" },
            { label: "Bài tập", value: totalExercises, unit: "bài", color: "from-cyan-500/20 to-cyan-500/5" },
            { label: "Tổng set", value: totalSets, unit: "set", color: "from-emerald-500/20 to-emerald-500/5" },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`p-3 rounded-2xl bg-gradient-to-br ${stat.color} border border-white/5 text-center`}
            >
              <p className="text-xl font-bold text-white">{stat.value}</p>
              <p className="text-[10px] text-white/40 mt-0.5">{stat.unit}</p>
              <p className="text-[10px] text-white/30">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Session list */}
      {dataLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : sortedSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <CalendarDays className="w-12 h-12 text-white/10" />
          <p className="text-white/30 text-sm">Chưa có lịch tập cho tuần {activeWeek}</p>
          <button
            onClick={() => { setEditingSession(undefined); setShowModal(true); }}
            className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-sm font-medium active:bg-indigo-500/25 transition-colors"
          >
            Tạo buổi tập đầu tiên
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map((session) => (
            <WorkoutCard
              key={session.id}
              session={session}
              isToday={session.day_of_week === todayDow && session.week_number === activeWeek}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Form modal */}
      {showModal && (
        <WorkoutFormModal
          defaultDay={todayDow}
          defaultWeek={activeWeek}
          session={editingSession}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditingSession(undefined); }}
        />
      )}
    </main>
  );
}