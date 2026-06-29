import { Link } from "react-router-dom";
import { SUBJECTS, lessonHref } from "../data/curriculum";
import mathImg from "../assets/Math.png";
import scienceImg from "../assets/Science.png";

const IMAGE_MAP = { math: mathImg, science: scienceImg };

export default function Subjects() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-ink-900">
          Today's Lessons
        </h1>
        <p className="text-ink-500 text-sm">
          JSS 1 · Pick a topic and the AI will teach it to you, step by step.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {SUBJECTS.map((s) => (
          <div
            key={s.id}
            className={`rounded-2xl shadow-card overflow-hidden bg-gradient-to-br ${s.tint} border border-white flex flex-col`}
          >
            <div className="p-6 flex items-start gap-4">
              <div
                className={`w-16 h-16 rounded-xl ${s.iconTint} flex items-center justify-center text-3xl shrink-0`}
              >
                {IMAGE_MAP[s.image] ? (
                  <img
                    src={IMAGE_MAP[s.image]}
                    alt=""
                    className="w-14 h-14 object-contain"
                  />
                ) : (
                  s.emoji
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-ink-500">JSS 1</div>
                <div className="font-bold text-lg text-ink-900">{s.name}</div>
              </div>
            </div>

            <div className="bg-white px-6 py-4 flex-1 space-y-2">
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
                        <div className="text-xs text-ink-500 mt-0.5">
                          {t.description}
                        </div>
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
        ))}
      </div>
    </div>
  );
}
