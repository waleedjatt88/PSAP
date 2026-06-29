import { Link } from "react-router-dom";
import { useUser } from "../store/user";
import { TargetIcon, FlameIcon, BookIcon, StarIcon } from "../components/icons";
import { SUBJECTS, lessonHref } from "../data/curriculum";
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

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl p-6 flex items-center justify-between shadow-card overflow-hidden">
        <div className="max-w-md">
          <h1 className="text-2xl font-extrabold text-ink-900">
            Good Morning, {user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-ink-500 mt-1">
            You have <strong>2 lessons</strong> ready for today.
          </p>
          <Link
            to="/subjects"
            className="inline-flex mt-4 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-full shadow-card"
          >
            View today's lessons →
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
          <div
            key={label}
            className="bg-white rounded-2xl p-4 shadow-card flex items-start justify-between"
          >
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

      {/* Today's lessons — the only two topics in the demo */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Today's Lessons</h2>
          <Link
            to="/subjects"
            className="text-xs font-semibold text-brand-blue hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          {SUBJECTS.map((s) => {
            const t = s.topics[0];
            return (
              <Link
                to={lessonHref(s.id, t.title)}
                key={s.id}
                className="group rounded-2xl p-5 shadow-card bg-white border border-ink-100 hover:shadow-soft transition-shadow flex items-center gap-5"
              >
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center ${s.iconTint} shrink-0`}
                >
                  {IMAGE_MAP[s.image] ? (
                    <img
                      src={IMAGE_MAP[s.image]}
                      alt={s.name}
                      className="w-14 h-14 object-contain"
                    />
                  ) : (
                    <span className="text-3xl">{s.emoji}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-ink-500">{s.name}</div>
                  <div className="font-bold text-ink-900">{t.title}</div>
                  {t.description && (
                    <div className="text-xs text-ink-500 mt-0.5 line-clamp-2">
                      {t.description}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-brand-blue group-hover:translate-x-1 transition-transform">
                  Start →
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
