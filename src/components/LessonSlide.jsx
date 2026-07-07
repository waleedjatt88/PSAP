import LessonVisual from "./LessonVisual";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons.jsx";
import useChromaKey from "../hooks/useChromaKey.js";
import { TEACHER_POINTED } from "../data/lessons/alphabetAssets.js";
import mathCardBg from "../assets/images/cardbg.png";

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
  "equation-reveal": "medium",
};

// For worked-example visuals, figure out how many steps should be
// visible based on the AI's current sentence.
function computeRevealStep(section, sectionStartIdx, currentIdx) {
  if (!["worked-example", "equation-reveal"].includes(section.visual?.type)) return 0;
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
  onPrevSlide,
  onNextSlide,
  canPrev = false,
  canNext = false,
  // eslint-disable-next-line no-unused-vars
  speaking = false,
  // eslint-disable-next-line no-unused-vars
  tint = "from-blue-50 via-white to-orange-50", // legacy subject-driven gradient (dark skin no longer uses it)
}) {
  const isEquationBoard = section?.visual?.type === "equation-reveal";
  const avatar = useChromaKey(TEACHER_POINTED, isEquationBoard);

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
        "relative rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col h-full slide-enter",
        "bg-[#0e0c24] border border-purple-500/15",
      ].join(" ")}
    >
      {/* Soft ambient tint so the dark stage doesn't feel flat */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10 pointer-events-none" />

      {/* Drifting background bubbles — same playful energy as the KG slide */}
      <BgBubbles />

      {/* Top capsule headers — subject/topic + slide number */}
      <div className="relative z-20 px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-2 shrink-0">
        <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 flex items-center gap-2 shadow-lg min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse shrink-0" />
          <span className="text-[10px] font-black text-indigo-100 tracking-widest font-display uppercase truncate">
            {subject} • {topic}
          </span>
        </div>
        <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 flex items-center shadow-lg shrink-0">
          <span className="text-[11px] font-extrabold text-white tracking-widest font-mono tabular-nums">
            {slideNumber} / {totalSlides}
          </span>
        </div>
      </div>

      {/* Heading bar */}
      <div className="relative z-10 px-5 sm:px-8 lg:px-12 py-3 sm:py-5 border-b border-white/10 shrink-0">
        <div
          className="text-[10px] sm:text-[11px] uppercase tracking-[0.2em] text-indigo-300 font-bold mb-1 animate-[fadeIn_0.4s_ease-out]"
          style={{ fontFamily: "Fredoka, system-ui, sans-serif" }}
        >
          Today's topic
        </div>
        <h2
          className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold text-white leading-[1.05] animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]"
          style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
        >
          {section.heading}
        </h2>
      </div>

      {/* Body — text + visual */}
      <div
        className={[
          "relative z-10 flex-1 min-h-0 grid gap-5 sm:gap-8 px-5 sm:px-8 lg:px-12 py-5 sm:py-8 overflow-y-auto scrollbar-hide",
          bodyGridCols,
        ].join(" ")}
      >
        {/* Sentences — active one highlighted */}
        <div className="text-base sm:text-lg lg:text-xl xl:text-2xl text-gray-300 leading-relaxed">
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
                      ? "bg-yellow-300 text-ink-900 ring-2 ring-yellow-400 shadow-md font-semibold"
                      : isPast
                        ? "text-gray-500"
                        : "hover:bg-white/10 hover:text-white",
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
          <div
            className={[
              "relative flex items-center justify-center backdrop-blur rounded-2xl shadow-2xl border p-4 sm:p-6 lg:p-8",
              isEquationBoard ? "bg-cover bg-center border-white/10 ml-10 sm:ml-16 lg:ml-20" : "bg-white/90 border-white/20",
            ].join(" ")}
            style={
              isEquationBoard
                ? {
                    backgroundImage: `linear-gradient(rgba(8,6,20,0.55), rgba(8,6,20,0.7)), url(${mathCardBg})`,
                  }
                : undefined
            }
          >
            {/* AI Teacher — stands right beside the board, pointing at it
                with the hand nearer to the card (image mirrored so the
                raised hand faces inward). A blurred contact shadow grounds
                her feet. */}
            {isEquationBoard && (
              <>
                <div className="pointer-events-none absolute -left-6 sm:-left-9 lg:-left-11 bottom-2 w-16 sm:w-24 lg:w-28 h-3 sm:h-4 bg-black/60 blur-md rounded-full z-[9]" />
                <img
                  src={avatar}
                  alt="AI Teacher"
                  draggable={false}
                  className="pointer-events-none select-none absolute -left-10 sm:-left-16 lg:-left-20 bottom-0 h-28 sm:h-40 lg:h-48 w-auto object-contain object-bottom drop-shadow-[0_15px_30px_rgba(0,0,0,0.5)] z-10"
                  style={{ transform: "scaleX(-1)" }}
                />
              </>
            )}
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

      {/* Previous / Next slide arrows overlaid on the stage */}
      {onPrevSlide && (
        <button
          onClick={onPrevSlide}
          disabled={!canPrev}
          className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 hover:scale-110 active:scale-90 transition-all duration-300 z-30 shadow-lg disabled:opacity-25 disabled:hover:scale-100"
          title="Previous slide"
        >
          <ArrowLeftIcon className="w-5 h-5" />
        </button>
      )}
      {onNextSlide && (
        <button
          onClick={onNextSlide}
          disabled={!canNext}
          className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white flex items-center justify-center hover:bg-black/60 hover:scale-110 active:scale-90 transition-all duration-300 z-30 shadow-lg disabled:opacity-25 disabled:hover:scale-100"
          title="Next slide"
        >
          <ArrowRightIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

// Floating bubbles in the background — same as KindergartenSlide.
function BgBubbles() {
  const bubbles = [
    { left: "6%", top: "18%", size: "120px", delay: "0s", color: "bg-white/5" },
    { left: "84%", top: "22%", size: "90px", delay: "0.6s", color: "bg-white/5" },
    { left: "18%", top: "78%", size: "110px", delay: "1.1s", color: "bg-white/5" },
    { left: "72%", top: "72%", size: "150px", delay: "1.6s", color: "bg-white/5" },
    { left: "48%", top: "8%", size: "60px", delay: "2.1s", color: "bg-white/5" },
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
