import { Link } from "react-router-dom";

const subjects = [
  { name: "English Language", emoji: "📚", topics: 12, progress: 58, tint: "from-rose-100 to-rose-50" },
  { name: "Mathematics", emoji: "📐", topics: 14, progress: 72, tint: "from-blue-100 to-blue-50" },
  { name: "Basic Science", emoji: "🌱", topics: 10, progress: 40, tint: "from-emerald-100 to-emerald-50" },
  { name: "Basic Technology", emoji: "🛠️", topics: 8, progress: 25, tint: "from-amber-100 to-amber-50" },
  { name: "Social Studies", emoji: "🌍", topics: 9, progress: 60, tint: "from-violet-100 to-violet-50" },
  { name: "Civic Education", emoji: "⚖️", topics: 7, progress: 30, tint: "from-cyan-100 to-cyan-50" },
  { name: "Computer Studies", emoji: "💻", topics: 6, progress: 80, tint: "from-indigo-100 to-indigo-50" },
  { name: "Agricultural Science", emoji: "🌾", topics: 8, progress: 15, tint: "from-lime-100 to-lime-50" },
  { name: "Business Studies", emoji: "💼", topics: 6, progress: 50, tint: "from-orange-100 to-orange-50" },
];

export default function Subjects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">Your Subjects</h1>
        <p className="text-ink-500 text-sm">JSS 1 · First Term · Aligned with the Nigerian curriculum</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {subjects.map((s) => (
          <Link
            to="/lesson"
            key={s.name}
            className={`block rounded-2xl shadow-card overflow-hidden bg-gradient-to-br ${s.tint} hover:shadow-soft transition-shadow border border-white`}
          >
            <div className="p-5">
              <div className="text-3xl">{s.emoji}</div>
              <div className="font-bold mt-3 text-ink-900">{s.name}</div>
              <div className="text-xs text-ink-500">{s.topics} topics</div>
              <div className="h-2 mt-3 rounded-full bg-white/70 overflow-hidden">
                <div className="h-full bg-brand-blue" style={{ width: `${s.progress}%` }} />
              </div>
              <div className="text-[11px] text-ink-500 mt-1">{s.progress}% complete</div>
            </div>
            <div className="bg-white px-5 py-3 text-xs font-semibold text-brand-blue">
              Continue learning →
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
