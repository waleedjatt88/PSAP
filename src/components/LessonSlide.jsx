import LessonVisual from "./LessonVisual";

// For worked-example visuals, figure out how many steps should be visible
// based on the AI's current sentence. If the lesson author supplied a
// `revealAtSentence` array, use that as a lookup; otherwise distribute
// the steps evenly across the section's sentences.
function computeRevealStep(section, sectionStartIdx, currentIdx) {
  if (section.visual?.type !== "worked-example") return 0;
  const localIdx = currentIdx >= sectionStartIdx ? currentIdx - sectionStartIdx : -1;
  if (localIdx < 0) return 0; // hasn't started this section yet
  const stepsCount = section.visual.steps?.length || 0;
  const mapping = section.visual.revealAtSentence;
  if (Array.isArray(mapping) && mapping.length > 0) {
    if (localIdx >= mapping.length) return stepsCount + 1; // fully done — also show final
    return mapping[localIdx];
  }
  // Default: evenly distribute steps across sentences.
  const total = section.sentences?.length || 1;
  return Math.min(stepsCount, Math.floor(((localIdx + 1) / total) * stepsCount));
}

// Full-screen presentation slide. Renders one lesson section like a
// PowerPoint slide: branded header bar, big heading, side-by-side text +
// topic-specific visual. The active sentence is highlighted teleprompter
// style so the student knows what the AI is speaking right now.
//
// Responsive behavior:
//   - mobile (< md): single column — text first, visual below.
//   - tablet+ (md+): two columns; ratios adapt to the visual's "weight".
//   - "banner" / "math" visuals are small → text gets the bulk of width.
//   - "pie" / "icon-grid" / "acronym" visuals are large → 50/50 split.
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

  const bodyGridCols = !hasVisual
    ? ""
    : weight === "large"
      ? "md:grid-cols-2"
      : weight === "medium"
        ? "md:grid-cols-[1.6fr_1fr]"
        : "md:grid-cols-[2fr_1fr]";

  return (
    <div
      key={section.id}
      className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full slide-enter"
    >
      {/* Slide chrome — subject + slide number (top banner) */}
      <div className="px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-blue text-white flex items-center justify-between text-xs sm:text-sm shrink-0">
        <div className="font-semibold tracking-wider uppercase text-[10px] sm:text-xs truncate">
          {subject} · {topic}
        </div>
        <div className="font-mono tabular-nums text-[10px] sm:text-xs bg-white/20 rounded-full px-2.5 sm:px-3 py-0.5 shrink-0">
          Slide {slideNumber} / {totalSlides}
        </div>
      </div>

      {/* Heading bar */}
      <div className="px-5 sm:px-8 lg:px-12 py-4 sm:py-6 border-b border-ink-100 shrink-0">
        <div className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-brand-blue font-bold mb-1">
          Topic
        </div>
        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-extrabold text-ink-900 leading-[1.05]">
          {section.heading}
        </h2>
      </div>

      {/* Body — text + visual */}
      <div
        className={[
          "flex-1 min-h-0 grid gap-5 sm:gap-8 px-5 sm:px-8 lg:px-12 py-5 sm:py-8 overflow-y-auto",
          bodyGridCols,
        ].join(" ")}
      >
        {/* Sentences with the active one highlighted */}
        <div className="text-base sm:text-lg lg:text-xl xl:text-2xl text-ink-700 leading-relaxed">
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

        {/* Topic-specific visual — plain white, no border. Content scales
            to fit within its column. For worked-example visuals, we
            compute how many steps to reveal based on which sentence the
            AI is reading right now (so the board fills in step-by-step). */}
        {hasVisual && (
          <div className="flex items-center justify-center bg-white py-2">
            <div className="w-full max-w-md">
              <LessonVisual
                visual={section.visual}
                revealStep={computeRevealStep(section, sectionStartIdx, currentIdx)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
