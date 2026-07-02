import { Link } from "react-router-dom";
import { useUser } from "../store/user";
import { TargetIcon, FlameIcon, BookIcon, StarIcon } from "../components/icons";
import { SUBJECTS, lessonHref } from "../data/curriculum";
import heroImg from "../assets/hero.png";
import mathImg from "../assets/Math.png";
import scienceImg from "../assets/Science.png";

const IMAGE_MAP = { math: mathImg, science: scienceImg };

const stats = [
  { label: "Today Goal", value: "20 min", trend: "+8%", icon: TargetIcon, tint: "bg-purple-500/15 text-purple-300" },
  { label: "Current Streak", value: "6 days", trend: "+1", icon: FlameIcon, tint: "bg-amber-500/15 text-amber-400" },
  { label: "Lesson Completed", value: "3", trend: "+2", icon: BookIcon, tint: "bg-emerald-500/15 text-emerald-400" },
  { label: "Total Points", value: "120", trend: "+15", icon: StarIcon, tint: "bg-indigo-500/15 text-indigo-300" },
];

export default function Dashboard() {
  const { user } = useUser();

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 flex items-center justify-between shadow-2xl overflow-hidden gap-3">
        <div className="max-w-md min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-white font-display">
            Good Morning, {user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-gray-400 mt-1">
            You have <strong className="text-gray-200">{SUBJECTS.length} lessons</strong> ready for today.
          </p>
          <Link
            to="/subjects"
            className="inline-flex mt-4 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:brightness-110 text-white text-sm font-semibold px-4 py-2 rounded-full shadow-lg"
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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, trend, icon: Icon, tint }) => (
          <div
            key={label}
            className="bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-xl flex items-start justify-between"
          >
            <div>
              <div className="text-xs text-gray-400">{label}</div>
              <div className="text-2xl font-bold mt-1 text-white">{value}</div>
              <div className="text-xs text-emerald-400 mt-1">▲ {trend}</div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* Today's lessons — every subject in the demo gets its own card */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-white font-display">Today's Lessons</h2>
          <Link
            to="/subjects"
            className="text-xs font-semibold text-purple-300 hover:text-white"
          >
            View all →
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {SUBJECTS.map((s) => {
            const t = s.topics[0];
            return (
              <Link
                to={lessonHref(s.id, t.title)}
                key={s.id}
                className="group rounded-2xl p-5 shadow-xl bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-colors flex items-center gap-5"
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
                  <div className="text-xs text-gray-400">{s.name}</div>
                  <div className="font-bold text-white">{t.title}</div>
                  {t.description && (
                    <div className="text-xs text-gray-400 mt-0.5 line-clamp-2">
                      {t.description}
                    </div>
                  )}
                </div>
                <div className="text-sm font-semibold text-purple-300 group-hover:translate-x-1 group-hover:text-white transition-all">
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
