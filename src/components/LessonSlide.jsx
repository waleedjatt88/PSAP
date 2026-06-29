import LessonVisual from "./LessonVisual";

// Full-screen presentation slide. Renders one lesson section like a real
// PowerPoint slide: branded header bar, big heading, side-by-side text +
// topic-specific visual. The active sentence is highlighted teleprompter
// style so the student knows what the AI is speaking right now.
//
// Props:
//   section: { id, heading, sentences[], visual? }
//   sectionStartIdx: index in the flat sentence list where this section begins
//   currentIdx: global current sentence index across the whole lesson
//   slideNumber, totalSlides
//   subject, topic — shown in the slide header
//   onSentenceClick: (globalIdx) => void
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

  return (
    <div
      key={section.id}
      className="bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full slide-enter border-4 border-ink-100"
    >
      {/* Slide chrome — subject + slide number (top banner) */}
      <div className="px-8 py-3 bg-gradient-to-r from-brand-blue to-brand-blue-light text-white flex items-center justify-between text-sm">
        <div className="font-semibold tracking-wide uppercase">
          {subject} · {topic}
        </div>
        <div className="font-mono tabular-nums text-xs bg-white/20 rounded-full px-3 py-0.5">
          Slide {slideNumber} / {totalSlides}
        </div>
      </div>

      {/* Heading bar */}
      <div className="px-10 py-6 border-b-2 border-ink-100 bg-gradient-to-b from-blue-50/40 to-transparent">
        <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold text-ink-900 leading-tight">
          {section.heading}
        </h2>
      </div>

      {/* Body — text on the left, visual aid on the right */}
      <div
        className={[
          "flex-1 min-h-0 grid gap-8 px-10 py-8 overflow-hidden",
          hasVisual ? "lg:grid-cols-[1.4fr_1fr]" : "",
        ].join(" ")}
      >
        {/* Sentences with active one highlighted */}
        <div className="text-lg md:text-xl lg:text-2xl text-ink-700 leading-relaxed overflow-y-auto">
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
                      ? "bg-yellow-200 text-ink-900 ring-2 ring-yellow-400 shadow-sm font-medium"
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
          <div className="flex items-center justify-center bg-ink-100/30 rounded-2xl p-6 overflow-y-auto">
            <LessonVisual visual={section.visual} />
          </div>
        )}
      </div>
    </div>
  );
}
