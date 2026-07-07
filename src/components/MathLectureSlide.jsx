import { useEffect, useMemo, useState } from "react";
import lectureImg from "../assets/images/lecturte.png";
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

const KEYWORD_TONES = [
  ["missing number", "amber"],
  ["greater than", "orange"],
  ["less than", "cyan"],
  ["equal to", "sky"],
  ["addition", "emerald"],
  ["subtraction", "sky"],
  ["multiplication", "violet"],
  ["division", "rose"],
  ["counting", "pink"],
  ["recognize", "pink"],
  ["true", "sky"],
];

const PILL_CLASS = {
  amber: "bg-amber-400 text-slate-900",
  orange: "bg-orange-400 text-slate-900",
  cyan: "bg-cyan-400 text-slate-900",
  emerald: "bg-emerald-400 text-slate-900",
  sky: "bg-sky-400 text-white",
  violet: "bg-violet-400 text-white",
  rose: "bg-rose-400 text-white",
  pink: "bg-pink-400 text-slate-900",
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
// reference design where only the unknown "blank" gets a badge.
function Plain({ children, tone = "white", show = true }) {
  const tones = {
    white: "text-white",
    op: "text-fuchsia-300",
  };
  return (
    <span
      className={[
        "font-extrabold tabular-nums transition-opacity duration-300",
        tones[tone] || tones.white,
        show ? "opacity-100" : "opacity-0",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// The dashed-circle "?" badge — the one thing in the equation that isn't
// plain text, since it's the unknown the student is solving for.
function Blank({ children, show, solved }) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 xl:w-[4.5rem] xl:h-[4.5rem] rounded-2xl border-2 border-dashed font-extrabold tabular-nums text-2xl sm:text-3xl lg:text-3xl xl:text-4xl transition-all duration-300",
        solved ? "border-emerald-400 bg-emerald-500/20 text-emerald-300" : "border-sky-400 bg-sky-500/20 text-sky-300",
        show ? "opacity-100 scale-100" : "opacity-0 scale-75",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

// Builds the equation row for every equation-reveal lesson type. Big
// plain numbers/operators, with only the unknown getting a badge.
function EquationTokens({ visual, revealStep }) {
  const showFirst = revealStep >= 1;
  const showSecond = revealStep >= 2;
  const showResult = revealStep >= 3;
  const { lessonType, firstNumber, secondNumber, operator, answer, resultShown } = visual;
  const missing = lessonType === "missing-number";

  const rowStyle = { fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" };
  const rowClass = "flex items-center justify-center gap-3 sm:gap-4 lg:gap-5 flex-wrap text-4xl sm:text-5xl lg:text-5xl xl:text-6xl";

  if (lessonType === "counting" || lessonType === "number-recognition") {
    return (
      <div className={rowClass} style={rowStyle}>
        <Plain show={showFirst}>{firstNumber}</Plain>
        <Plain tone="op" show={showResult}>
          = {numberWord(firstNumber)}
        </Plain>
      </div>
    );
  }

  if (["greater-than", "less-than", "equal-to"].includes(lessonType)) {
    return (
      <div className={rowClass} style={rowStyle}>
        <Plain show={showFirst}>{firstNumber}</Plain>
        <Blank show={showSecond} solved={showResult}>
          {showResult ? operator : "?"}
        </Blank>
        <Plain show={showSecond}>{secondNumber}</Plain>
      </div>
    );
  }

  return (
    <div className={rowClass} style={rowStyle}>
      <Plain show={showFirst}>{firstNumber}</Plain>
      <Plain tone="op" show={showSecond}>{operator}</Plain>
      {missing ? (
        <Blank show={showSecond} solved={showResult}>
          {showResult ? answer : "?"}
        </Blank>
      ) : (
        <Plain show={showSecond}>{secondNumber}</Plain>
      )}
      <Plain tone="op" show={showSecond}>=</Plain>
      <Plain show={missing ? showSecond : showResult}>
        {missing ? resultShown : showResult ? answer : ""}
      </Plain>
    </div>
  );
}

const OPTION_COLORS = [
  "bg-emerald-500 hover:bg-emerald-400",
  "bg-amber-500 hover:bg-amber-400",
  "bg-sky-500 hover:bg-sky-400",
  "bg-pink-500 hover:bg-pink-400",
];

// Four clickable multiple-choice numbers — a visual, click-based
// alternative to the voice "now you try" quiz, for the lesson types whose
// answer is a plain number.
function AnswerOptions({ correctAnswer, sectionId }) {
  const options = useMemo(() => {
    const distractors = new Set();
    let delta = 1;
    while (distractors.size < 3) {
      const a = correctAnswer - delta;
      const b = correctAnswer + delta;
      if (a > 0 && a !== correctAnswer) distractors.add(a);
      if (distractors.size < 3 && b !== correctAnswer) distractors.add(b);
      delta += 1;
    }
    const all = [correctAnswer, ...distractors];
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionId, correctAnswer]);

  const [picked, setPicked] = useState(null);

  useEffect(() => setPicked(null), [sectionId]);

  return (
    <div className="flex items-center gap-2.5 sm:gap-3 lg:gap-5 flex-wrap justify-center">
      {options.map((opt, i) => {
        const isPicked = picked === opt;
        const isCorrect = opt === correctAnswer;
        const showState = picked !== null && isPicked;
        return (
          <button
            key={opt}
            onClick={() => setPicked(opt)}
            className={[
              "relative w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] lg:w-20 lg:h-20 xl:w-[5.5rem] xl:h-[5.5rem] rounded-2xl text-white font-extrabold text-2xl sm:text-3xl lg:text-3xl xl:text-4xl shadow-[0_6px_0_rgba(0,0,0,0.25),0_10px_18px_rgba(0,0,0,0.35)] transition-all active:scale-95 active:shadow-[0_2px_0_rgba(0,0,0,0.25)] overflow-hidden",
              showState
                ? isCorrect
                  ? "bg-emerald-500 ring-4 ring-emerald-300/60"
                  : "bg-rose-500 ring-4 ring-rose-300/60 animate-[bounce-soft_0.4s_ease-in-out]"
                : OPTION_COLORS[i % OPTION_COLORS.length],
            ].join(" ")}
          >
            <span className="absolute inset-x-1 top-1 h-1/3 rounded-full bg-white/25 pointer-events-none" />
            <span className="relative">{opt}</span>
          </button>
        );
      })}
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
}) {
  const revealStep = computeRevealStep(section, sectionStartIdx, currentIdx);
  const visual = section.visual;
  const isEquation = visual?.type === "equation-reveal";
  const numericAnswerTypes = ["addition", "subtraction", "multiplication", "division", "missing-number"];
  const showOptions = isEquation && revealStep >= 2 && numericAnswerTypes.includes(visual?.lessonType);
  const correctAnswer = visual?.lessonType === "missing-number" ? visual.answer : visual?.answer;

  const [firstWord, ...restWords] = section.heading.split(" ");

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

      {/* Body — definition/equation column + illustrated scene */}
      <div className="relative z-10 flex-1 min-h-0 grid gap-5 sm:gap-6 lg:gap-8 px-5 sm:px-8 lg:px-12 py-4 sm:py-6 overflow-y-auto scrollbar-hide md:grid-cols-2">
        {/* Left column — centered, matching the reference design. Sizes
            step up again at lg/xl so this column fills as much vertical
            space as the image column does on large screens/F11, instead
            of looking small and centered with empty space around it. */}
        <div className="min-w-0 flex flex-col items-center text-center justify-center gap-3.5 lg:gap-5 xl:gap-6">
          <div className="inline-flex items-center gap-2">
            <span className="text-amber-300 text-sm lg:text-base">✦</span>
            <span className="text-[10px] sm:text-[11px] lg:text-xs xl:text-sm font-black tracking-[0.2em] text-indigo-200 uppercase">
              Today's Topic
            </span>
            <span className="text-amber-300 text-sm lg:text-base">✦</span>
          </div>

          <h2
            className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight"
            style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
          >
            <span className="text-white">{firstWord}</span>{" "}
            <span className="bg-gradient-to-r from-fuchsia-400 to-purple-400 bg-clip-text text-transparent">
              {restWords.join(" ")}
            </span>
          </h2>

          {/* Unified glowing card — definition, divider, then the equation */}
          <div className="relative w-full rounded-3xl border-2 border-fuchsia-400/40 bg-[#1a1440]/70 backdrop-blur-xl shadow-[0_0_45px_-8px_rgba(217,70,239,0.45)] px-5 sm:px-7 lg:px-8 xl:px-9 py-5 sm:py-6 lg:py-6 xl:py-7">
            <span className="pointer-events-none absolute -top-3 -left-3 text-amber-300 text-lg lg:text-xl">✦</span>
            <span className="pointer-events-none absolute -top-3 -right-3 text-pink-300 text-lg lg:text-xl">✦</span>
            <span className="pointer-events-none absolute -bottom-3 -left-3 text-amber-300/80 text-base lg:text-lg">✦</span>
            <span className="pointer-events-none absolute top-3 right-4 text-lg lg:text-xl">💡</span>

            <p className="text-gray-100 text-sm sm:text-base lg:text-lg xl:text-xl leading-relaxed">
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

            {isEquation && (
              <>
                <div className="my-4 lg:my-6 border-t border-white/10" />
                <EquationTokens visual={visual} revealStep={revealStep} />
              </>
            )}
          </div>

          {showOptions && (
            <div className="flex flex-col items-center gap-2 lg:gap-3">
              <div className="text-[10px] lg:text-sm font-black tracking-widest text-indigo-300 uppercase">
                Pick the answer
              </div>
              <AnswerOptions correctAnswer={correctAnswer} sectionId={section.id} />
            </div>
          )}

          {/* Progress row */}
          <div className="flex items-center gap-2 lg:gap-3 w-full max-w-xs lg:max-w-sm xl:max-w-md">
            <span className="text-amber-300 text-xs lg:text-base shrink-0">★</span>
            <span className="text-[10px] lg:text-sm text-gray-400 font-semibold whitespace-nowrap">
              Lesson {slideNumber}/{totalSlides}
            </span>
            <div className="flex-1 h-1.5 lg:h-2.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-purple-500 to-fuchsia-400"
                style={{ width: `${Math.round((slideNumber / totalSlides) * 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 lg:gap-4 w-full mt-1 shrink-0">
            <button
              onClick={onPrevSlide}
              disabled={!canPrev}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm lg:text-base xl:text-lg font-bold text-white bg-violet-600 hover:brightness-110 rounded-full px-4 py-2.5 lg:py-3 xl:py-3.5 shadow-lg transition disabled:opacity-30 disabled:hover:brightness-100"
            >
              ← Previous
            </button>
            <button
              onClick={onNextSlide}
              disabled={!canNext}
              className="flex-1 flex items-center justify-center gap-1.5 text-sm lg:text-base xl:text-lg font-bold text-white bg-sky-600 hover:brightness-110 rounded-full px-4 py-2.5 lg:py-3 xl:py-3.5 shadow-lg transition disabled:opacity-30 disabled:hover:brightness-100"
            >
              Next →
            </button>
          </div>
        </div>

        {/* Right column — illustrated scene. The image is sized to always
            fill the div's full width (w-full h-auto, centered vertically)
            so it never shows empty side bars — any leftover space lands
            above/below instead, and nothing gets cropped either. */}
        <div className="relative min-w-0 min-h-[220px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0818] flex items-center justify-center">
          <img
            src={lectureImg}
            alt="AI Math Teacher"
            className="w-full h-auto"
            draggable={false}
          />
          <div className="absolute top-4 right-4 max-w-[65%] bg-white text-slate-900 rounded-2xl rounded-tr-sm px-4 py-2.5 shadow-xl text-xs sm:text-sm font-bold">
            {speechPrompt(visual, section.heading)}
          </div>
        </div>
      </div>
    </div>
  );
}
