import LessonVisual from "./LessonVisual";

// Full-screen presentation slide. Renders one lesson section like a real
// PowerPoint slide: branded header bar, big heading, side-by-side text +
// topic-specific visual. The active sentence is highlighted teleprompter
// style so the student knows what the AI is speaking right now.
//
// Layout rules:
//  - "banner" / "math" visuals are small — text gets the bulk of width.
//  - "pie", "two-pies", "icon-grid", "acronym" visuals are big — split 50/50.
//
// Props:
//   section: { id, heading, sentences[], visual? }
//   sectionStartIdx: index in the flat sentence list where this section begins
//   currentIdx: global current sentence index across the whole lesson
//   slideNumber, totalSlides
//   subject, topic
//   onSentenceClick: (globalIdx) => void
const VISUAL_WEIGHT = {
  banner: "small",
  math: "medium",
  pie: "large",
  "mixed-pies": "large",
  "two-pies": "large",
  "icon-grid": "large",
  acronym: "large",
};

export default function LessonSlide({
  section,
  sectionStartIdx,
  currentIdx,
  slideNumber,
  totalSlides,
  subject,
  topic,
  onSentenceClick,
}) {
  if (!section) return null;

  const hasVisual = Boolean(section.visual);
  const weight = hasVisual
    ? VISUAL_WEIGHT[section.visual.type] || "medium"
    : null;

  const bodyGridCols =
    weight === "large"
      ? "lg:grid-cols-2"
      : weight === "medium"
        ? "lg:grid-cols-[1.6fr_1fr]"
        : weight === "small"
          ? "lg:grid-cols-[2fr_1fr]"
          : ""; // no visual — text fills

  return (
    <div
      key={section.id}
      className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full slide-enter border-4 border-ink-100"
    >
      {/* Slide chrome — subject + slide number (top banner) */}
      <div className="px-8 py-3 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-blue text-white flex items-center justify-between text-sm shrink-0">
        <div className="font-semibold tracking-wider uppercase text-xs">
          {subject} · {topic}
        </div>
        <div className="font-mono tabular-nums text-xs bg-white/20 rounded-full px-3 py-1">
          Slide {slideNumber} / {totalSlides}
        </div>
      </div>

      {/* Heading bar */}
      <div className="px-10 lg:px-14 py-7 border-b-2 border-ink-100 bg-gradient-to-b from-blue-50/60 to-transparent shrink-0">
        <div className="text-[11px] uppercase tracking-[0.2em] text-brand-blue font-bold mb-1">
          Topic
        </div>
        <h2 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-ink-900 leading-[1.05]">
          {section.heading}
        </h2>
      </div>

      {/* Body — text on the left, visual aid on the right */}
      <div
        className={[
          "flex-1 min-h-0 grid gap-10 px-10 lg:px-14 py-10 overflow-hidden",
          bodyGridCols,
        ].join(" ")}
      >
        {/* Sentences with the active one highlighted */}
        <div className="text-xl lg:text-2xl xl:text-3xl text-ink-700 leading-relaxed overflow-y-auto pr-2">
          <p>
            {section.sentences.map((text, i) => {
              const globalIdx = sectionStartIdx + i;
              const isCurrent = globalIdx === currentIdx;
              const isPast = currentIdx >= 0 && globalIdx < currentIdx;
              return (
                <span
                  key={i}
                  onClick={() => onSentenceClick?.(globalIdx)}
                  className={[
                    "cursor-pointer transition-all duration-200 rounded px-1 -mx-1",
                    isCurrent
                      ? "bg-yellow-200 text-ink-900 ring-2 ring-yellow-400 shadow-md font-semibold"
                      : isPast
                        ? "text-ink-500"
                        : "hover:bg-ink-100",
                  ].join(" ")}
                  title="Click to start the lesson from here"
                >
                  {text}{" "}
                </span>
              );
            })}
          </p>
        </div>

        {/* Topic-specific visual (pie chart, icon grid, etc.) */}
        {hasVisual && (
          <div className="flex items-center justify-center bg-gradient-to-br from-ink-100/40 to-blue-50/40 rounded-2xl p-6 lg:p-8 overflow-y-auto border border-ink-100">
            <div className="w-full max-w-md">
              <LessonVisual visual={section.visual} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
