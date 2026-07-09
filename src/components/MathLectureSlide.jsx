import { forwardRef, useLayoutEffect, useRef, useState } from "react";
import boardImg from "../assets/images/borad.png";
import MarkerPen from "./MarkerPen.jsx";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons.jsx";
import { computeRevealStep } from "../lib/revealStep.js";
import { numberWord } from "../lib/numberWords.js";

// Bespoke slide layout for the AI Math Teacher's equation lessons — a
// dedicated design (not the generic LessonSlide grid used by every other
// lesson type): a glass "definition card" with color-coded math vocabulary,
// an equation card with a reveal-synced blank, clickable multiple-choice
// practice, and a full illustrated scene on the right.

const SPEECH_PROMPTS = {
  addition: "Can you solve the addition?",
  subtraction: "Can you solve the subtraction?",
  multiplication: "Can you solve the multiplication?",
  division: "Can you solve the division?",
  "missing-number": "Can you find the missing number?",
  counting: "Can you count them all?",
  "number-recognition": "Can you name this number?",
  "greater-than": "Which number is bigger?",
  "less-than": "Which number is smaller?",
  "equal-to": "Are these two equal?",
};

// What the teacher's speech bubble asks — tailored per lesson type, with
// a friendly generic greeting for the non-equation "Welcome" intro.
function speechPrompt(visual, heading) {
  if (visual?.type === "equation-reveal") {
    return SPEECH_PROMPTS[visual.lessonType] || `Let's learn ${heading.toLowerCase()}!`;
  }
  return "Let's learn math together!";
}

// Muted tint pills — the same "bg-X-500/15 text-X-300" language the rest
// of the app uses for accent chips (see Dashboard's stat icons), instead
// of the solid saturated candy colors used in the original mockup.
const KEYWORD_TONES = [
  ["missing number", "amber"],
  ["greater than", "orange"],
  ["less than", "cyan"],
  ["equal to", "indigo"],
  ["addition", "emerald"],
  ["subtraction", "sky"],
  ["multiplication", "violet"],
  ["division", "rose"],
  ["counting", "purple"],
  ["recognize", "purple"],
  ["true", "indigo"],
];

const PILL_CLASS = {
  amber: "bg-amber-500/15 text-amber-300",
  orange: "bg-orange-500/15 text-orange-300",
  cyan: "bg-cyan-500/15 text-cyan-300",
  emerald: "bg-emerald-500/15 text-emerald-300",
  sky: "bg-sky-500/15 text-sky-300",
  violet: "bg-violet-500/15 text-violet-300",
  rose: "bg-rose-500/15 text-rose-300",
  purple: "bg-purple-500/15 text-purple-300",
  indigo: "bg-indigo-500/15 text-indigo-300",
};

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const KEYWORD_PATTERN = new RegExp(
  `(${[...KEYWORD_TONES]
    .sort((a, b) => b[0].length - a[0].length)
    .map(([w]) => escapeRegExp(w))
    .join("|")})`,
  "gi",
);

// Wraps recognized math vocabulary in a colored pill, leaving the rest of
// the sentence as plain text.
function highlightKeywords(text) {
  const parts = text.split(KEYWORD_PATTERN);
  return parts.map((part, i) => {
    const tone = KEYWORD_TONES.find(([w]) => w.toLowerCase() === part.toLowerCase())?.[1];
    if (!tone) return <span key={i}>{part}</span>;
    return (
      <span key={i} className={`inline-block px-1.5 py-0.5 mx-0.5 rounded-md font-bold ${PILL_CLASS[tone]}`}>
        {part}
      </span>
    );
  });
}

// A plain bold number/operator — no chip background, matching the
// reference design where only the unknown "blank" gets a badge. Dark
// tones because these now sit directly on the (light) whiteboard image
// instead of the dark glass card.
//
// Revealed via a left-to-right clip-path wipe rather than a fade — that's
// what makes it read as the marker actually writing the glyph in, instead
// of the number just materializing. Forwards its ref so EquationTokens
// can measure exactly where the marker tip needs to be.
const Plain = forwardRef(function Plain({ children, tone = "dark", show = true }, ref) {
  const tones = {
    dark: "text-slate-900",
    op: "text-purple-600",
  };
  return (
    <span
      ref={ref}
      className={["font-extrabold tabular-nums inline-block", tones[tone] || tones.dark].join(" ")}
      style={{
        clipPath: show ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
        transition: "clip-path 420ms ease-out",
      }}
    >
      {children}
    </span>
  );
});

// The dashed-circle "?" badge — the one thing in the equation that isn't
// plain text, since it's the unknown the student is solving for. Sized to
// fit within the whiteboard region of the classroom photo.
const Blank = forwardRef(function Blank({ children, show, solved }, ref) {
  return (
    <span
      ref={ref}
      className={[
        "inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 xl:w-11 xl:h-11 rounded-lg sm:rounded-xl border-2 border-dashed font-extrabold tabular-nums text-sm sm:text-base lg:text-lg xl:text-xl transition-all duration-300",
        solved ? "border-emerald-500 bg-emerald-500/15 text-emerald-700" : "border-sky-500 bg-sky-500/15 text-sky-700",
        show ? "opacity-100 scale-100" : "opacity-0 scale-75",
      ].join(" ")}
    >
      {children}
    </span>
  );
});

// Marker size on the board — a fixed pixel box so the measured-position
// math below (which anchors the nib, not the box) stays simple.
const PEN_W = 46;
const PEN_H = PEN_W / 3.5; // matches MarkerPen's 140:40 viewBox

// A small pen icon that tracks whichever token just got written, measured
// via getBoundingClientRect rather than guessed — so it lines up exactly
// regardless of how long the numbers are or what size they render at.
// `activeRef` is whichever of the three token refs is currently "live";
// `wrapRef` is the common ancestor both are measured against.
//
// Re-measures on more than just `dep` changing: the "Permanent Marker"
// webfont loads asynchronously, and its glyphs are a different size than
// the fallback font the browser paints first — if we only measured once
// per reveal step, the pen would lock onto the pre-swap position and end
// up floating next to (not on) the number once the real font landed. A
// ResizeObserver on the row catches that reflow (and any other layout
// change) and re-syncs the pen to it automatically.
function TrackingPen({ wrapRef, activeRef, dep }) {
  const [pos, setPos] = useState(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const measure = () => {
      const el = activeRef?.current;
      if (!el) {
        setPos(null);
        return;
      }
      const wrapRect = wrap.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      setPos({
        x: elRect.right - wrapRect.left + 2,
        y: elRect.top - wrapRect.top + elRect.height * 0.55,
      });
    };

    measure();
    document.fonts?.ready?.then(measure);
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dep]);

  if (!pos) return null;
  return (
    <MarkerPen
      className="absolute pointer-events-none select-none drop-shadow-md"
      style={{
        left: pos.x,
        top: pos.y - PEN_H / 2,
        width: PEN_W,
        height: PEN_H,
        transformOrigin: "0% 50%",
        transform: "rotate(-35deg)",
        transition: "left 380ms ease-out, top 380ms ease-out",
      }}
    />
  );
}

// Builds the equation row for every equation-reveal lesson type. Big
// plain numbers/operators, with only the unknown getting a badge, plus a
// marker that visually writes each one in as it's revealed.
//
// `quiz` swaps in the section's `visual.quiz` numbers (a fresh example,
// not the one just taught) and keeps the final answer permanently hidden
// behind a "?" — this is the "now you try" question written on the
// board itself, answered out loud rather than shown.
function EquationTokens({ visual, revealStep, quiz = false }) {
  const data = quiz ? { ...visual, ...visual.quiz } : visual;
  const showFirst = quiz ? true : revealStep >= 1;
  const showSecond = quiz ? true : revealStep >= 2;
  const showResult = quiz ? false : revealStep >= 3;
  const { lessonType, firstNumber, secondNumber, operator, answer, resultShown } = data;
  const missing = lessonType === "missing-number";

  const wrapRef = useRef(null);
  const firstRef = useRef(null);
  const secondRef = useRef(null);
  const resultRef = useRef(null);
  const activeRef = showResult ? resultRef : showSecond ? secondRef : showFirst ? firstRef : null;

  const rowStyle = { fontFamily: "'Permanent Marker', cursive" };
  const rowClass = "flex items-center justify-center gap-1.5 sm:gap-2 lg:gap-3 flex-wrap text-base sm:text-xl lg:text-2xl xl:text-3xl";

  let row;
  if (lessonType === "counting" || lessonType === "number-recognition") {
    row = (
      <div className={rowClass} style={rowStyle}>
        <Plain ref={firstRef} show={showFirst}>{firstNumber}</Plain>
        <Plain ref={resultRef} tone="op" show={showResult}>
          = {numberWord(firstNumber)}
        </Plain>
      </div>
    );
  } else if (["greater-than", "less-than", "equal-to"].includes(lessonType)) {
    row = (
      <div className={rowClass} style={rowStyle}>
        <Plain ref={firstRef} show={showFirst}>{firstNumber}</Plain>
        <Blank ref={secondRef} show={showSecond} solved={showResult}>
          {showResult ? operator : "?"}
        </Blank>
        <Plain ref={resultRef} show={showSecond}>{secondNumber}</Plain>
      </div>
    );
  } else {
    row = (
      <div className={rowClass} style={rowStyle}>
        <Plain ref={firstRef} show={showFirst}>{firstNumber}</Plain>
        <Plain ref={secondRef} tone="op" show={showSecond}>{operator}</Plain>
        {missing ? (
          <Blank show={showSecond} solved={showResult}>
            {showResult ? answer : "?"}
          </Blank>
        ) : (
          <Plain show={showSecond}>{secondNumber}</Plain>
        )}
        <Plain tone="op" show={showSecond}>=</Plain>
        {missing ? (
          <Plain ref={resultRef} show={showSecond}>{resultShown}</Plain>
        ) : (
          <Blank ref={resultRef} show={showSecond} solved={showResult}>
            {showResult ? answer : "?"}
          </Blank>
        )}
      </div>
    );
  }

  return (
    <div key={quiz ? "quiz" : "main"} ref={wrapRef} className="relative">
      {row}
      <TrackingPen wrapRef={wrapRef} activeRef={activeRef} dep={`${revealStep}-${firstNumber}-${secondNumber}-${answer}`} />
    </div>
  );
}

export default function MathLectureSlide({
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
  presentMode = false,
}) {
  const revealStep = computeRevealStep(section, sectionStartIdx, currentIdx);
  const visual = section.visual;
  const isEquation = visual?.type === "equation-reveal";

  // The lesson's last sentence is always its "now you try" quiz question
  // (see kg-ai-math-operations.js) — while it's the one being narrated,
  // the board swaps from the just-taught example to that fresh quiz
  // question instead, written on the board the same way the lesson was.
  const lastSentenceIdx = section.sentences.length - 1;
  const localIdx = currentIdx - sectionStartIdx;
  const isQuizActive =
    isEquation &&
    Boolean(visual.quiz) &&
    localIdx === lastSentenceIdx &&
    /now you try/i.test(section.sentences[lastSentenceIdx] || "");

  const [firstWord, ...restWords] = (isQuizActive ? "Your Turn" : section.heading).split(" ");

  return (
    <div className="relative rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col h-full slide-enter bg-[#0e0c24] border border-purple-500/15">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10 pointer-events-none" />

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

      {/* Body — hero classroom photo (heading + equation live on its
          whiteboard) followed by the read-along card, quiz, and nav. */}
      <div className="relative z-10 flex-1 min-h-0 flex flex-col items-stretch">
        {/* Hero image — the classroom scene with a blank whiteboard, filling
            every remaining pixel of the stage edge-to-edge (no side gaps,
            no scroll). It's stretched to the container's exact size rather
            than aspect-ratio-boxed, so the overlay's percentage-based
            positions below still line up with the board's surface — a
            crop-based fit would shift the visible board around depending
            on the screen's aspect ratio. */}
        <div className="relative flex-1 min-h-0 w-full overflow-hidden bg-[#0a0818]">
          <img
            src={boardImg}
            alt="AI Math Teacher at the whiteboard"
            className="absolute inset-0 w-full h-full transition-transform duration-500 ease-out"
            style={{ transform: presentMode ? "scale(1.14)" : "scale(1)" }}
            draggable={false}
          />

          {/* Heading + equation, positioned directly on the whiteboard. The
              marker itself now lives inside EquationTokens — it tracks
              and "writes" each number in real time instead of sitting in
              one fixed spot (see MarkerPen.jsx / TrackingPen above). */}
          <div
            className="absolute flex flex-col items-center justify-center text-center gap-1 sm:gap-1.5 lg:gap-2 transition-transform duration-500 ease-out"
            style={{
              left: "15%",
              top: "9%",
              width: "50%",
              height: "42%",
              transform: presentMode ? "scale(1.35)" : "scale(1)",
              transformOrigin: "center",
            }}
          >
            <div className="inline-flex items-center gap-1.5">
              <span className="text-amber-500 text-[9px] sm:text-xs">✦</span>
              <span className="text-[7px] sm:text-[9px] lg:text-[11px] font-black tracking-[0.18em] text-purple-600 uppercase">
                {isQuizActive ? "Now You Try" : "Today's Topic"}
              </span>
              <span className="text-amber-500 text-[9px] sm:text-xs">✦</span>
            </div>
            <h2
              className="text-xl sm:text-3xl lg:text-4xl xl:text-5xl leading-[1.05]"
              style={{ fontFamily: "'Permanent Marker', cursive" }}
            >
              <span className="text-slate-900">{firstWord}</span>{" "}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
                {restWords.join(" ")}
              </span>
            </h2>
            {isEquation && <EquationTokens visual={visual} revealStep={revealStep} quiz={isQuizActive} />}
          </div>

          <div
            className="absolute bg-white text-slate-900 rounded-2xl rounded-tr-sm px-3 py-2 shadow-xl text-[9px] sm:text-xs font-bold"
            style={{ top: "4%", right: "2%", maxWidth: "28%" }}
          >
            {speechPrompt(visual, section.heading)}
          </div>

          {/* Read-along caption — a frosted glass panel floating over the
              bottom of the photo instead of a separate block stacked below
              it, so the slide's total height stays pinned to the image's
              and never forces the stage to scroll. In present mode, Lesson.jsx
              renders its own floating play/waveform pill (bottom-4 left-4,
              measured ~114px wide) and Exit pill (bottom-4 right-4, ~75px
              wide) in this same corner — the padding below reserves exactly
              that much space so the caption text never runs under them. */}
          <div
            className={[
              "absolute inset-x-2 sm:inset-x-3 bottom-2 sm:bottom-3 max-h-[34%] overflow-y-auto scrollbar-hide rounded-2xl border border-white/15 bg-black/40 backdrop-blur-xl shadow-xl py-2 sm:py-2.5",
              presentMode ? "pl-[136px] sm:pl-[150px] pr-[92px] sm:pr-[104px]" : "pl-3 sm:pl-4 pr-3 sm:pr-4",
            ].join(" ")}
          >
            <p className="text-white text-[10px] sm:text-xs lg:text-sm leading-snug">
              {section.sentences.map((text, i) => {
                const globalIdx = sectionStartIdx + i;
                const isCurrent = globalIdx === currentIdx;
                const isPast = currentIdx >= 0 && globalIdx < currentIdx;
                return (
                  <span
                    key={i}
                    onClick={() => onSentenceClick?.(globalIdx)}
                    className={[
                      "cursor-pointer transition-opacity duration-200",
                      isCurrent ? "opacity-100 font-semibold text-white" : isPast ? "opacity-50" : "opacity-90 hover:opacity-100",
                    ].join(" ")}
                    title="Click to start the lesson from here"
                  >
                    {highlightKeywords(text)}{" "}
                  </span>
                );
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Previous / Next slide arrows overlaid on the stage — same
          floating circular icon buttons every other lesson type uses
          (see LessonSlide), instead of a bottom pill-button row. */}
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
