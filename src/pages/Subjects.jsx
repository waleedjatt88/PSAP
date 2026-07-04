import { Link } from "react-router-dom";
import { SUBJECTS, lessonHref } from "../data/curriculum";
import mathImg from "../assets/Math.png";
import kgLettersImg from "../assets/images/svg (1).png";
import kgNumbersImg from "../assets/images/svg (2).png";
import kgObjectsImg from "../assets/images/svg (3).png";
import kgShapesImg from "../assets/images/svg (4).png";
import basicScienceImg from "../assets/images/svg (5).png";
import kgBodyImg from "../assets/images/svg (6).png";

const IMAGE_MAP = {
  math: mathImg,
  science: basicScienceImg,
  "kg-letters": kgLettersImg,
  "kg-numbers": kgNumbersImg,
  "kg-objects": kgObjectsImg,
  "kg-shapes": kgShapesImg,
  "kg-body": kgBodyImg,
};

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
        <h1 className="text-2xl font-extrabold text-white font-display">Today's Lessons</h1>
        <p className="text-gray-400 text-sm">
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
                    ? "text-xl font-extrabold text-purple-300"
                    : "text-xl font-extrabold text-white font-display"
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
              <span className="text-xs text-gray-400">{tier.subtitle}</span>
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
      className="group/card relative rounded-2xl shadow-2xl overflow-hidden bg-[#0c0a21]/60 backdrop-blur-xl border border-white/10 hover:border-purple-500/30 transition-colors flex flex-col"
      style={
        playful
          ? { fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }
          : undefined
      }
    >
      {/* Water-filling hover effect — rises from the bottom with an
          animated wave crest, purely decorative and behind the content. */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none rounded-2xl">
        <div className="absolute inset-x-0 bottom-0 h-0 group-hover/card:h-full transition-[height] duration-[1400ms] ease-in-out">
          <div className="absolute inset-x-0 bottom-0 top-3 bg-gradient-to-t from-purple-600/35 via-indigo-500/20 to-indigo-400/5" />
          <div className="absolute inset-x-0 top-0 h-4 sm:h-5 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 w-[200%] animate-[wave-x_3.2s_linear_infinite] opacity-70"
              style={{
                backgroundImage:
                  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 20'%3E%3Cpath d='M0 10 Q 25 0 50 10 T 100 10 T 150 10 T 200 10 V20 H0 Z' fill='%238b5cf6' fill-opacity='0.55'/%3E%3C/svg%3E\")",
                backgroundRepeat: "repeat-x",
                backgroundSize: "100px 20px",
              }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 p-5 sm:p-6 flex items-start gap-4">
        <div
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${s.iconTint} flex items-center justify-center text-3xl sm:text-4xl shrink-0`}
        >
          {IMAGE_MAP[s.image] ? (
            <img
              src={IMAGE_MAP[s.image]}
              alt=""
              className="w-full h-full object-cover rounded-2xl"
            />
          ) : (
            s.emoji
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-gray-400">
            {playful ? "Kindergarten" : "JSS 1"}
          </div>
          <div className="font-bold text-lg sm:text-xl text-white">{s.name}</div>
        </div>
      </div>

      <div className="relative z-10 border-t border-white/10 px-5 sm:px-6 py-4 flex-1 space-y-2">
        {s.topics.map((t) => (
          <Link
            key={t.title}
            to={lessonHref(s.id, t.title)}
            className="block rounded-xl border border-white/10 p-3 hover:border-purple-500/30 hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-semibold text-white group-hover:text-purple-300">
                  {t.title}
                </div>
                {t.description && (
                  <div className="text-xs text-gray-400 mt-0.5">{t.description}</div>
                )}
              </div>
              <div className="text-xs font-semibold text-purple-300 shrink-0 mt-0.5">
                Start →
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
