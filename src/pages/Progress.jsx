const weeks = [
  { d: "Mon", h: 35 },
  { d: "Tue", h: 60 },
  { d: "Wed", h: 45 },
  { d: "Thu", h: 80 },
  { d: "Fri", h: 70 },
  { d: "Sat", h: 50 },
  { d: "Sun", h: 92 },
];

const subjects = [
  { name: "Mathematics", value: 78, color: "bg-blue-500" },
  { name: "Basic Science", value: 64, color: "bg-emerald-500" },
  { name: "English", value: 58, color: "bg-rose-500" },
  { name: "Social Studies", value: 70, color: "bg-violet-500" },
];

export default function Progress() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">Your Progress</h1>
        <p className="text-ink-500 text-sm">Track learning consistency, strengths and areas to improve.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Stat label="Lessons Completed" value="34" hint="+6 this week" />
        <Stat label="Avg. Score" value="78%" hint="+4% vs last week" />
        <Stat label="Time Spent" value="14h 20m" hint="This term" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="font-bold mb-1">Weekly Activity</div>
          <div className="text-xs text-ink-500 mb-4">Minutes learning per day</div>
          <div className="h-44 flex items-end gap-3">
            {weeks.map(({ d, h }) => (
              <div key={d} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-lg bg-gradient-to-t from-brand-blue to-brand-blue-light"
                  style={{ height: `${h}%` }}
                />
                <div className="text-[11px] text-ink-500">{d}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-5">
          <div className="font-bold mb-1">Subject Mastery</div>
          <div className="text-xs text-ink-500 mb-4">Average score across subjects</div>
          <div className="space-y-3">
            {subjects.map((s) => (
              <div key={s.name}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-medium">{s.name}</span>
                  <span className="text-ink-500">{s.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-ink-100 overflow-hidden">
                  <div className={`h-full ${s.color}`} style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-5">
        <div className="font-bold mb-3">AI Recommendations</div>
        <ul className="space-y-2 text-sm text-ink-700">
          <li>📌 Revise <strong>Equivalent Fractions</strong> — your last quiz showed 2 errors.</li>
          <li>🎯 Try a <strong>10-min daily quiz</strong> in Social Studies to push above 80%.</li>
          <li>🔥 You're on a <strong>6-day streak</strong>. Practice today to extend it!</li>
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="bg-white rounded-2xl shadow-card p-5">
      <div className="text-xs text-ink-500">{label}</div>
      <div className="text-3xl font-extrabold mt-1">{value}</div>
      <div className="text-xs text-emerald-600 mt-1">{hint}</div>
    </div>
  );
}
