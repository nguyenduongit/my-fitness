export default function SchedulePage() {
  return (
    <main className="p-6 min-h-full">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-6">Lịch tập</h1>
      <div className="grid gap-4">
        {/* Placeholder cards */}
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              T{i+1}
            </div>
            <div>
              <h3 className="font-semibold text-lg text-white/90">Buổi tập {i}</h3>
              <p className="text-white/50 text-sm mt-1">Nghỉ ngơi hoặc tập nhẹ</p>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
