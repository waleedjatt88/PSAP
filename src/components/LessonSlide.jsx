import LessonVisual from "./LessonVisual";

// Full-screen presentation slide for JSS lessons (Maths, Basic Science, …).
// Same energy as the Kindergarten slide — colourful gradient backdrop,
// drifting bubbles, big animated visual on the right — but with the
// proper educational copy on the left so older students can read along
// while the AI teacher narrates.
//
// Responsive:
//   mobile (< md): single column — text first, visual below.
//   tablet+      : two columns; ratios adapt to the visual's "weight".
//
// Visual weights:
//   banner / math      → text gets the bulk of width
//   pie / icon-grid /
//   acronym / worked-example → 50/50 split (visual is the star)
const VISUAL_WEIGHT = {
  banner: "small",
  math: "medium",
  pie: "large",
  "mixed-pies": "large",
  "two-pies": "large",
  "icon-grid": "large",
  acronym: "large",
  "worked-example": "large",
};

// For worked-example visuals, figure out how many steps should be
// visible based on the AI's current sentence.
function computeRevealStep(section, sectionStartIdx, currentIdx) {
  if (section.visual?.type !== "worked-example") return 0;
  const localIdx =
    currentIdx >= sectionStartIdx ? currentIdx - sectionStartIdx : -1;
  if (localIdx < 0) return 0;
  const stepsCount = section.visual.steps?.length || 0;
  const mapping = section.visual.revealAtSentence;
  if (Array.isArray(mapping) && mapping.length > 0) {
    if (localIdx >= mapping.length) return stepsCount + 1;
    return mapping[localIdx];
  }
  const total = section.sentences?.length || 1;
  return Math.min(stepsCount, Math.floor(((localIdx + 1) / total) * stepsCount));
}

export default function LessonSlide({
  section,
  sectionStartIdx,
  currentIdx,
  slideNumber,
  totalSlides,
  subject,
  topic,
  onSentenceClick,
  tint = "from-blue-50 via-white to-orange-50", // subject-driven gradient
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
        ? "md:grid-cols-[1.4fr_1fr]"
        : "md:grid-cols-[1.8fr_1fr]";

  return (
    <div
      key={section.id}
      className={[
        "relative rounded-3xl shadow-2xl overflow-hidden flex flex-col h-full slide-enter",
        "bg-gradient-to-br",
        tint,
      ].join(" ")}
    >
      {/* Drifting background bubbles — same playful energy as the KG slide */}
      <BgBubbles />

      {/* Slide chrome — subject + slide number (top banner) */}
      <div className="relative z-10 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-brand-blue via-brand-blue-light to-brand-blue text-white flex items-center justify-between text-xs sm:text-sm shrink-0">
        <div className="font-semibold tracking-wider uppercase text-[10px] sm:text-xs truncate">
          {subject} · {topic}
        </div>
        <div className="font-mono tabular-nums text-[10px] sm:text-xs bg-white/20 rounded-full px-2.5 sm:px-3 py-0.5 shrink-0">
          Slide {slideNumber} / {totalSlides}
        </div>
      </div>

      {/* Heading bar */}
      <div className="relative z-10 px-5 sm:px-8 lg:px-12 py-4 sm:py-6 border-b border-white/40 shrink-0">
        <div
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-brand-blue font-bold mb-1 animate-[fadeIn_0.4s_ease-out]"
          style={{ fontFamily: "Fredoka, system-ui, sans-serif" }}
        >
          Today's topic
        </div>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-ink-900 leading-[1.05] animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]"
          style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
        >
          {section.heading}
        </h2>
      </div>

      {/* Body — text + visual */}
      <div
        className={[
          "relative z-10 flex-1 min-h-0 grid gap-5 sm:gap-8 px-5 sm:px-8 lg:px-12 py-5 sm:py-8 overflow-y-auto",
          bodyGridCols,
        ].join(" ")}
      >
        {/* Sentences — active one highlighted */}
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

        {/* Topic-specific visual — bigger, animated, dominant */}
        {hasVisual && (
          <div className="flex items-center justify-center bg-white/70 backdrop-blur rounded-2xl shadow-card p-4 sm:p-6 lg:p-8">
            <div className="w-full max-w-lg">
              <LessonVisual
                visual={section.visual}
                revealStep={computeRevealStep(
                  section,
                  sectionStartIdx,
                  currentIdx,
                )}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating bubbles in the background — same as KindergartenSlide.
function BgBubbles() {
  const bubbles = [
    { left: "6%", top: "18%", size: "120px", delay: "0s", color: "bg-white/30" },
    { left: "84%", top: "22%", size: "90px", delay: "0.6s", color: "bg-white/30" },
    { left: "18%", top: "78%", size: "110px", delay: "1.1s", color: "bg-white/30" },
    { left: "72%", top: "72%", size: "150px", delay: "1.6s", color: "bg-white/30" },
    { left: "48%", top: "8%", size: "60px", delay: "2.1s", color: "bg-white/30" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className={`absolute rounded-full ${b.color} animate-[float_5s_ease-in-out_infinite]`}
          style={{
            left: b.left,
            top: b.top,
            width: b.size,
            height: b.size,
            animationDelay: b.delay,
          }}
        />
      ))}
    </div>
  );
}
