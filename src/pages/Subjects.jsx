import { Link } from "react-router-dom";
import { SUBJECTS, lessonHref } from "../data/curriculum";
import mathImg from "../assets/Math.png";
import scienceImg from "../assets/Science.png";

const IMAGE_MAP = { math: mathImg, science: scienceImg };

const TIERS = [
  {
    id: "kindergarten",
    title: "Kindergarten",
    subtitle: "Bright, playful lessons — mostly pictures, lots of fun.",
    playful: true,
  },
  {
    id: "jss",
    title: "JSS 1",
    subtitle: "Full classroom lessons, aligned with the Nigerian curriculum.",
    playful: false,
  },
];

export default function Subjects() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">Today's Lessons</h1>
        <p className="text-ink-500 text-sm">
          Pick a topic and the AI tutor will teach it to you, step by step.
        </p>
      </div>

      {TIERS.map((tier) => {
        const subjects = SUBJECTS.filter((s) => s.classTier === tier.id);
        if (!subjects.length) return null;
        return (
          <section key={tier.id} className="space-y-3">
            <div className="flex items-baseline gap-3 flex-wrap">
              <h2
                className={
                  tier.playful
                    ? "text-xl font-extrabold text-brand-blue"
                    : "text-xl font-extrabold text-ink-900"
                }
                style={
                  tier.playful
                    ? { fontFamily: "Fredoka, system-ui, sans-serif" }
                    : undefined
                }
              >
                {tier.playful ? "🌈 " : ""}
                {tier.title}
              </h2>
              <span className="text-xs text-ink-500">{tier.subtitle}</span>
            </div>

            <div
              className={
                tier.playful
                  ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
                  : "grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4"
              }
            >
              {subjects.map((s) => (
                <SubjectCard key={s.id} subject={s} playful={tier.playful} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function SubjectCard({ subject: s, playful }) {
  return (
    <div
      className={[
        "rounded-2xl shadow-card overflow-hidden bg-gradient-to-br border border-white flex flex-col",
        s.tint,
      ].join(" ")}
      style={
        playful
          ? { fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }
          : undefined
      }
    >
      <div className="p-5 sm:p-6 flex items-start gap-4">
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${s.iconTint} flex items-center justify-center text-3xl sm:text-4xl shrink-0`}
        >
          {IMAGE_MAP[s.image] ? (
            <img
              src={IMAGE_MAP[s.image]}
              alt=""
              className="w-12 h-12 sm:w-14 sm:h-14 object-contain"
            />
          ) : (
            s.emoji
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-ink-500">
            {playful ? "Kindergarten" : "JSS 1"}
          </div>
          <div className="font-bold text-lg sm:text-xl text-ink-900">{s.name}</div>
        </div>
      </div>

      <div className="bg-white px-5 sm:px-6 py-4 flex-1 space-y-2">
        {s.topics.map((t) => (
          <Link
            key={t.title}
            to={lessonHref(s.id, t.title)}
            className="block rounded-xl border border-ink-100 p-3 hover:border-brand-blue hover:bg-blue-50/40 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-ink-900 group-hover:text-brand-blue">
                  {t.title}
                </div>
                {t.description && (
                  <div className="text-xs text-ink-500 mt-0.5">{t.description}</div>
                )}
              </div>
              <div className="text-xs font-semibold text-brand-blue shrink-0 mt-0.5">
                Start →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
