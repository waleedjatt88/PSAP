import { Link } from "react-router-dom";
import { SUBJECTS, lessonHref } from "../data/curriculum";
import mathImg from "../assets/Math.png";
import scienceImg from "../assets/Science.png";

const IMAGE_MAP = { math: mathImg, science: scienceImg };

export default function Subjects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">Your Subjects</h1>
        <p className="text-ink-500 text-sm">
          JSS 1 · First Term · Aligned with the Nigerian curriculum. Click any
          topic to start an AI-led lesson.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {SUBJECTS.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl shadow-card overflow-hidden bg-gradient-to-br ${s.tint} border border-white flex flex-col`}
          >
            <div className="p-5 flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-xl ${s.iconTint} flex items-center justify-center text-3xl shrink-0`}
              >
                {IMAGE_MAP[s.image] ? (
                  <img
                    src={IMAGE_MAP[s.image]}
                    alt=""
                    className="w-12 h-12 object-contain"
                  />
                ) : (
                  s.emoji
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-ink-900">{s.name}</div>
                <div className="text-xs text-ink-500">
                  {s.topics.length} topics
                </div>
                <div className="h-2 mt-2 rounded-full bg-white/70 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${s.accent}`}
                    style={{ width: `${s.progress}%` }}
                  />
                </div>
                <div className="text-[11px] text-ink-500 mt-1">
                  {s.progress}% complete
                </div>
              </div>
            </div>

            <div className="bg-white px-5 py-3 flex-1">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-500 mb-2">
                Topics
              </div>
              <div className="flex flex-wrap gap-1.5">
                {s.topics.map((t) => (
                  <Link
                    key={t}
                    to={lessonHref(s.id, t)}
                    className="text-[11px] bg-ink-100 hover:bg-brand-blue hover:text-white text-ink-700 rounded-full px-2.5 py-1 transition-colors"
                  >
                    {t}
                  </Link>
                ))}
              </div>
              <Link
                to={lessonHref(s.id, s.topics[0])}
                className="block mt-3 text-xs font-semibold text-brand-blue hover:underline"
              >
                Continue learning →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
