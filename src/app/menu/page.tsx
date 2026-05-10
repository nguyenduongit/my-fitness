export default function MenuPage() {
  return (
    <main className="p-6 min-h-full">
      <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent mb-6">Thực đơn</h1>
      <div className="grid gap-4">
        {/* Placeholder cards */}
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <h3 className="font-semibold text-lg text-white/90">Bữa {i === 1 ? "sáng" : i === 2 ? "trưa" : "tối"}</h3>
            <p className="text-white/50 text-sm mt-1">Đang cập nhật thực đơn...</p>
          </div>
        ))}
      </div>
    </main>
  );
}
