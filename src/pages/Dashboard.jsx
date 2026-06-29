import { Link } from "react-router-dom";
import { useUser } from "../store/user";
import { TargetIcon, FlameIcon, BookIcon, StarIcon } from "../components/icons";
import { SUBJECTS, findSubject, lessonHref } from "../data/curriculum";
import heroImg from "../assets/hero.png";
import mathImg from "../assets/Math.png";
import scienceImg from "../assets/Science.png";

const IMAGE_MAP = { math: mathImg, science: scienceImg };

const stats = [
  { label: "Today Goal", value: "20 min", trend: "+8%", icon: TargetIcon, tint: "bg-blue-100 text-brand-blue" },
  { label: "Current Streak", value: "6 days", trend: "+1", icon: FlameIcon, tint: "bg-orange-100 text-brand-orange" },
  { label: "Lesson Completed", value: "3", trend: "+2", icon: BookIcon, tint: "bg-green-100 text-emerald-600" },
  { label: "Total Points", value: "120", trend: "+15", icon: StarIcon, tint: "bg-purple-100 text-purple-600" },
];

// Recent activity is illustrative — uses real subject + topic data.
const recent = [
  { subjectId: "mathematics", topic: "Fractions", score: 85, color: "stroke-blue-500" },
  { subjectId: "basic-science", topic: "Photosynthesis", score: 72, color: "stroke-emerald-500" },
  { subjectId: "english", topic: "Parts of Speech", score: 90, color: "stroke-rose-500" },
];

export default function Dashboard() {
  const { user } = useUser();
  // Featured = first two subjects on the dashboard for the "Your Subjects" card row.
  const featured = SUBJECTS.slice(0, 2);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl p-6 flex items-center justify-between shadow-card overflow-hidden">
        <div className="max-w-md">
          <h1 className="text-2xl font-extrabold text-ink-900">
            Good Morning, {user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-ink-500 mt-1">Ready to continue your learning journey</p>
          <Link
            to={lessonHref("mathematics", "Fractions")}
            className="inline-flex mt-4 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-full shadow-card"
          >
            Let's continue your journey →
          </Link>
        </div>
        <img
          src={heroImg}
          alt="PassPoint mascot"
          className="hidden md:block h-32 object-contain"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, trend, icon: Icon, tint }) => (
          <div key={label} className="bg-white rounded-2xl p-4 shadow-card flex items-start justify-between">
            <div>
              <div className="text-xs text-ink-500">{label}</div>
              <div className="text-2xl font-bold mt-1">{value}</div>
              <div className="text-xs text-emerald-600 mt-1">▲ {trend}</div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Subjects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Your Subjects</h2>
          <Link to="/subjects" className="text-xs font-semibold text-brand-blue hover:underline">
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {featured.map((s) => (
            <Link
              to={lessonHref(s.id, s.topics[0])}
              key={s.id}
              className="group rounded-2xl p-5 shadow-card bg-white border border-ink-100 hover:shadow-soft transition-shadow flex items-center gap-5"
            >
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${s.iconTint} shrink-0`}>
                {IMAGE_MAP[s.image] ? (
                  <img src={IMAGE_MAP[s.image]} alt={s.name} className="w-14 h-14 object-contain" />
                ) : (
                  <span className="text-3xl">{s.emoji}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900">{s.name}</div>
                <div className="text-xs text-ink-500">
                  JSS 1 · Next: {s.topics[0]}
                </div>
                <div className="h-2 mt-3 rounded-full bg-ink-100 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${s.accent}`}
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <div className="text-[11px] text-ink-500 mt-1">{s.progress}% complete</div>
              </div>
              <Donut value={s.progress} />
            </Link>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div>
        <h2 className="text-lg font-bold mb-3">Recent Activity</h2>
        <div className="grid md:grid-cols-3 gap-4">
          {recent.map((r, i) => {
            const sub = findSubject(r.subjectId);
            return (
              <Link
                to={lessonHref(r.subjectId, r.topic)}
                key={i}
                className="bg-white rounded-2xl p-5 shadow-card flex items-center justify-between hover:shadow-soft transition-shadow"
              >
                <div>
                  <div className="font-semibold text-ink-900">{r.topic}</div>
                  <div className="text-xs text-ink-500">{sub.name}</div>
                  <div className="text-xs text-emerald-600 mt-2">Completed</div>
                </div>
                <ScoreRing value={r.score} stroke={r.color} />
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Donut({ value }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="shrink-0">
      <circle cx="30" cy="30" r={r} className="fill-none stroke-ink-100" strokeWidth="6" />
      <circle
        cx="30"
        cy="30"
        r={r}
        className="fill-none stroke-brand-orange"
        strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
      />
      <text x="30" y="34" textAnchor="middle" className="fill-ink-900 text-[11px] font-bold">
        {value}%
      </text>
    </svg>
  );
}

function ScoreRing({ value, stroke }) {
  const r = 22;
  const c = 2 * Math.PI * r;
  const offset = c - (value / 100) * c;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" className="shrink-0">
      <circle cx="30" cy="30" r={r} className="fill-none stroke-ink-100" strokeWidth="6" />
      <circle
        cx="30"
        cy="30"
        r={r}
        className={`fill-none ${stroke}`}
        strokeWidth="6"
        strokeDasharray={c}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 30 30)"
      />
      <text x="30" y="34" textAnchor="middle" className="fill-ink-900 text-[11px] font-bold">
        {value}%
      </text>
    </svg>
  );
}
