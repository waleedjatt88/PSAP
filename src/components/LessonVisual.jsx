// Per-slide visual aid — like the diagrams a teacher would point at on a
// chalkboard. Each lesson section can supply a `visual` object that picks
// one of these renderers. All visuals enter with a soft scale animation
// and idle-animate (float / pulse) so the slide feels alive.

import { numberWord } from "../lib/numberWords.js";

export default function LessonVisual({ visual, revealStep }) {
  if (!visual) return null;
  return (
    <div key={JSON.stringify(visual)} className="w-full animate-[visual-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
      {renderInner(visual, revealStep)}
    </div>
  );
}

function renderInner(visual, revealStep) {
  switch (visual.type) {
    case "pie":
      return <PieVisual num={visual.num} den={visual.den} label={visual.label} />;
    case "mixed-pies":
      return <MixedPiesVisual whole={visual.whole} num={visual.num} den={visual.den} />;
    case "two-pies":
      return <TwoPiesVisual a={visual.a} b={visual.b} note={visual.note} />;
    case "math":
      return <MathVisual expression={visual.expression} steps={visual.steps} />;
    case "worked-example":
      return (
        <WorkedExampleVisual
          problem={visual.problem}
          steps={visual.steps}
          final={visual.final}
          revealStep={revealStep}
        />
      );
    case "icon-grid":
      return <IconGridVisual items={visual.items} columns={visual.columns} />;
    case "acronym":
      return <AcronymVisual word={visual.word} meanings={visual.meanings} highlight={visual.highlight} />;
    case "banner":
      return <BannerVisual icon={visual.icon} label={visual.label} subtitle={visual.subtitle} />;
    case "equation-reveal":
      return <EquationRevealVisual visual={visual} revealStep={revealStep} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Equation reveal — a "board" that writes in one token at a time as the AI
// narrates: first number, then operator + second number, then the answer.
// `revealStep` comes from the section's `revealAtSentence` mapping, same
// mechanism the worked-example visual above uses.
//   0 → nothing written yet   1 → first number   2 → operator + second
//   3 → answer + explanation

function EquationRevealVisual({ visual, revealStep = 0 }) {
  const showFirst = revealStep >= 1;
  const showSecond = revealStep >= 2;
  const showResult = revealStep >= 3;

  switch (visual.lessonType) {
    case "counting":
      return <CountingReveal visual={visual} showFirst={showFirst} showResult={showResult} />;
    case "number-recognition":
      return <NumberRecognitionReveal visual={visual} showFirst={showFirst} showResult={showResult} />;
    case "greater-than":
    case "less-than":
    case "equal-to":
      return (
        <ComparisonReveal
          visual={visual}
          showFirst={showFirst}
          showSecond={showSecond}
          showResult={showResult}
        />
      );
    default:
      return (
        <EquationReveal
          visual={visual}
          showFirst={showFirst}
          showSecond={showSecond}
          showResult={showResult}
          missing={visual.lessonType === "missing-number"}
        />
      );
  }
}

// Frosted-glass shell shared by every equation-reveal variant: a soft
// gradient border ring, translucent BLACK over blur, a faint top sheen,
// and two brand-color glows tucked behind the corners — a dark
// glassmorphism take so the moody cardbg.png photo behind it (and the
// dark stage around it) shows through instead of being washed out white.
function GlassCard({ className = "", children }) {
  return (
    <div className="relative w-full rounded-[1.75rem] p-[1.5px] bg-gradient-to-br from-blue-400/30 via-white/15 to-orange-400/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.65)] animate-[float_4s_ease-in-out_infinite]">
      <div
        className={[
          "relative w-full overflow-hidden rounded-[calc(1.75rem-1.5px)] bg-black/40 backdrop-blur-2xl",
          className,
        ].join(" ")}
      >
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />
        <div className="absolute -top-10 -left-10 w-36 h-36 bg-blue-500/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -right-10 w-36 h-36 bg-orange-500/25 rounded-full blur-3xl pointer-events-none" />
        {/* Shine sweep — a light streak drifts across the glass every few seconds */}
        <div
          className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none"
          style={{ animation: "shine-sweep 6s ease-in-out infinite" }}
        />
        <div className="relative z-10">{children}</div>
      </div>
    </div>
  );
}

function EquationReveal({ visual, showFirst, showSecond, showResult, missing }) {
  const { firstNumber, secondNumber, operator, answer, resultShown } = visual;
  return (
    <GlassCard className="px-6 sm:px-10 py-8 sm:py-10">
      <div className="flex items-center justify-center gap-3 sm:gap-5 flex-wrap">
        <NumTile show={showFirst}>{firstNumber}</NumTile>
        <OpTile show={showSecond}>{operator}</OpTile>
        <NumTile show={showSecond} tone={missing ? "rose" : undefined}>
          {missing ? (showResult ? answer : "?") : secondNumber}
        </NumTile>
        <OpTile show={showSecond}>=</OpTile>
        <NumTile show={missing ? showSecond : showResult} tone="emerald">
          {missing ? resultShown : showResult ? answer : ""}
        </NumTile>
      </div>
    </GlassCard>
  );
}

function ComparisonReveal({ visual, showFirst, showSecond, showResult }) {
  const { firstNumber, secondNumber, operator } = visual;
  return (
    <GlassCard className="px-8 sm:px-12 py-8 sm:py-10">
      <div className="flex items-center justify-center gap-4 sm:gap-6">
        <NumTile show={showFirst}>{firstNumber}</NumTile>
        <div
          className={[
            "w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center rounded-2xl border-2 font-extrabold transition-all duration-300",
            "text-2xl sm:text-3xl",
            showResult
              ? "opacity-100 scale-100 border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-lg shadow-orange-500/30"
              : "opacity-80 scale-95 border-dashed border-blue-400/30 bg-blue-500/10 text-blue-300/70 animate-pulse",
          ].join(" ")}
          style={{ animation: showResult ? "item-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : undefined }}
        >
          {showResult ? operator : "?"}
        </div>
        <NumTile show={showSecond}>{secondNumber}</NumTile>
      </div>
    </GlassCard>
  );
}

function CountingReveal({ visual, showFirst, showResult }) {
  const { firstNumber, icon } = visual;
  return (
    <GlassCard className="px-6 sm:px-10 py-8 sm:py-10">
      <div className="flex flex-col items-center gap-5">
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 max-w-md">
          {Array.from({ length: firstNumber }).map((_, i) => (
            <span
              key={i}
              className="text-3xl sm:text-4xl"
              style={{
                opacity: showFirst ? 1 : 0,
                animation: showFirst
                  ? `item-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.12}s both, gentle-bob 3s ease-in-out ${i * 0.15}s infinite`
                  : undefined,
              }}
            >
              {icon || "⭐"}
            </span>
          ))}
        </div>
        <div
          className="text-6xl sm:text-7xl font-extrabold text-blue-300 tabular-nums transition-opacity duration-300"
          style={{
            fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif",
            opacity: showResult ? 1 : 0,
            animation: showResult ? "item-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : undefined,
          }}
        >
          {firstNumber}
        </div>
      </div>
    </GlassCard>
  );
}

function NumberRecognitionReveal({ visual, showFirst, showResult }) {
  const { firstNumber } = visual;
  return (
    <GlassCard className="px-6 sm:px-10 py-10 sm:py-12">
      <div className="flex flex-col items-center gap-4">
        <div
          className="text-8xl sm:text-9xl font-extrabold text-blue-300 tabular-nums transition-opacity duration-300"
          style={{
            fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif",
            opacity: showFirst ? 1 : 0,
            animation: showFirst ? "item-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : undefined,
          }}
        >
          {firstNumber}
        </div>
        <div
          className="text-xl sm:text-2xl font-bold text-gray-300 uppercase tracking-widest transition-opacity duration-300"
          style={{
            opacity: showResult ? 1 : 0,
            animation: showResult ? "step-in 0.4s ease-out both" : undefined,
          }}
        >
          {numberWord(firstNumber)}
        </div>
      </div>
    </GlassCard>
  );
}

// One number/answer tile — a soft rounded chip that pops in with a
// colored border, tint, and glow (rather than a bare floating digit).
function NumTile({ show, tone, children }) {
  const TONES = {
    emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-300 shadow-emerald-500/30",
    rose: "border-rose-400/30 bg-rose-500/15 text-rose-300 shadow-rose-500/30",
    default: "border-blue-400/30 bg-blue-500/15 text-blue-300 shadow-blue-500/30",
  };
  const tones = TONES[tone] || TONES.default;
  return (
    <div
      className={[
        "min-w-[3.5rem] sm:min-w-[4.5rem] lg:min-w-[5.5rem] flex items-center justify-center rounded-2xl border-2 px-3 sm:px-4 py-2 sm:py-3 font-extrabold tabular-nums transition-all duration-300",
        "text-4xl sm:text-5xl lg:text-6xl",
        show ? `opacity-100 scale-100 shadow-lg ${tones}` : "opacity-0 scale-90",
      ].join(" ")}
      style={{
        fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif",
        animation: show ? "item-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : undefined,
      }}
    >
      {children}
    </div>
  );
}

// One operator tile (+, −, ×, ÷, =) — a circular badge, highlighted in
// orange per spec, matching the NumTile chip language.
function OpTile({ show, children }) {
  return (
    <div
      className={[
        "w-11 h-11 sm:w-14 sm:h-14 flex items-center justify-center rounded-full border-2 font-extrabold transition-all duration-300",
        "text-2xl sm:text-3xl",
        show
          ? "opacity-100 scale-100 border-orange-400/30 bg-orange-500/15 text-orange-300 shadow-lg shadow-orange-500/30"
          : "opacity-0 scale-90",
      ].join(" ")}
      style={{ animation: show ? "item-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) both" : undefined }}
    >
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Worked example — a math problem solved step-by-step on a "chalkboard".
// As the AI narrates each step, the matching row reveals (animated). The
// parent component passes `revealStep` (1-based count of how many steps
// should be visible right now).

function WorkedExampleVisual({ problem, steps = [], final, revealStep = 0 }) {
  const visibleCount = Math.min(revealStep, steps.length);
  return (
    <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-2xl border-2 border-slate-700 font-mono text-base lg:text-lg w-full">
      <div className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 font-bold mb-2">
        Worked Example
      </div>
      <div className="text-xl lg:text-2xl text-white font-bold mb-4 border-b border-slate-700 pb-3">
        {problem}
      </div>
      <ol className="space-y-2.5">
        {steps.map((s, i) => {
          const isVisible = i < visibleCount;
          const isCurrent = i === visibleCount - 1;
          return (
            <li
              key={i}
              className={[
                "flex items-start gap-3 transition-all duration-500",
                isVisible
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2",
                isCurrent
                  ? "bg-yellow-300/10 ring-1 ring-yellow-300/40 rounded-lg px-2 py-1 -mx-2"
                  : "",
              ].join(" ")}
              style={isVisible ? { animation: "step-in 0.4s ease-out" } : {}}
            >
              <span
                className={[
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                  isCurrent
                    ? "bg-yellow-300 text-slate-900"
                    : "bg-slate-700 text-slate-200",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <div className="min-w-0">
                {s.label && (
                  <div className="text-[11px] text-slate-400 uppercase tracking-wide mb-0.5">
                    {s.label}
                  </div>
                )}
                <div className="text-base lg:text-lg text-white whitespace-pre-wrap break-words">
                  {s.text}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      {final && visibleCount >= steps.length && (
        <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between gap-3 animate-[item-pop_0.5s_ease-out]">
          <span className="text-[11px] uppercase tracking-wide text-emerald-400 font-bold">
            Answer
          </span>
          <span className="text-2xl lg:text-3xl font-extrabold text-emerald-300 tabular-nums">
            {final}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Pie chart — colored slices for `num / den`. Used for fractions.
// Idle: gentle float up/down. The fraction caption also throbs subtly.

function PieVisual({ num, den, label }) {
  const slices = [];
  const cx = 100;
  const cy = 100;
  const r = 80;
  for (let i = 0; i < den; i++) {
    const startAngle = (i / den) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const filled = i < num;
    slices.push(
      <path
        key={i}
        d={path}
        fill={filled ? "#F59E0B" : "#FFF7E8"}
        stroke="#1E3A8A"
        strokeWidth="2"
        style={{
          animation: filled
            ? `slice-in 0.45s ease-out ${i * 0.08}s both`
            : `slice-fade 0.3s ease-out ${i * 0.05}s both`,
          transformOrigin: `${cx}px ${cy}px`,
        }}
      />,
    );
  }
  return (
    <div className="flex flex-col items-center gap-4 animate-[float_4s_ease-in-out_infinite]">
      <svg
        viewBox="0 0 200 200"
        className="w-72 h-72 sm:w-80 sm:h-80 lg:w-96 lg:h-96 drop-shadow-2xl"
      >
        {slices}
      </svg>
      <div className="text-center">
        <div
          className="text-7xl sm:text-8xl lg:text-9xl font-extrabold text-brand-blue tabular-nums leading-none"
          style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
        >
          {num}/{den}
        </div>
        {label && (
          <div className="text-sm sm:text-base text-ink-500 mt-3 max-w-[20rem]">
            {label}
          </div>
        )}
      </div>
    </div>
  );
}

// One full pie + a partial pie — used for improper / mixed fractions.

function MixedPiesVisual({ whole, num, den }) {
  return (
    <div className="flex flex-col items-center gap-4 animate-[float_4s_ease-in-out_infinite]">
      <div className="flex items-end gap-4 flex-wrap justify-center">
        {Array.from({ length: whole }).map((_, i) => (
          <PieMini key={i} num={den} den={den} size={130} />
        ))}
        {num > 0 && <PieMini num={num} den={den} size={130} />}
      </div>
      <div className="text-center">
        <div className="text-5xl lg:text-6xl font-extrabold text-brand-blue">
          {whole}
          <span className="text-3xl lg:text-4xl ml-2">
            {num}/{den}
          </span>
        </div>
      </div>
    </div>
  );
}

// Two pies side by side — for equivalent fractions.

function TwoPiesVisual({ a, b, note }) {
  return (
    <div className="flex flex-col items-center gap-4 animate-[float_4s_ease-in-out_infinite]">
      <div className="flex items-center gap-4">
        <PieMini num={a.num} den={a.den} size={140} />
        <div className="text-4xl text-brand-blue font-bold animate-pulse">=</div>
        <PieMini num={b.num} den={b.den} size={140} />
      </div>
      <div className="text-center text-2xl lg:text-3xl font-bold text-brand-blue tabular-nums">
        {a.num}/{a.den} = {b.num}/{b.den}
      </div>
      {note && <div className="text-sm text-ink-500">{note}</div>}
    </div>
  );
}

function PieMini({ num, den, size = 100 }) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.4;
  const slices = [];
  for (let i = 0; i < den; i++) {
    const startAngle = (i / den) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const filled = i < num;
    slices.push(
      <path
        key={i}
        d={path}
        fill={filled ? "#F59E0B" : "#FFF7E8"}
        stroke="#1E3A8A"
        strokeWidth="2"
      />,
    );
  }
  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      className="shrink-0 drop-shadow"
    >
      {slices}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Math expression — big, with steps that fade in sequentially.

function MathVisual({ expression, steps }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center w-full">
      <div
        className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-extrabold text-brand-blue px-6 sm:px-10 py-8 sm:py-10 bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200 rounded-3xl tabular-nums shadow-2xl animate-[float_4s_ease-in-out_infinite]"
        style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
      >
        {expression}
      </div>
      {steps?.length > 0 && (
        <div className="space-y-2 mt-2 w-full max-w-md">
          {steps.map((s, i) => (
            <div
              key={i}
              className="text-base lg:text-lg text-ink-700 flex items-start gap-2 bg-white rounded-lg p-2 border border-ink-100"
              style={{
                animation: `step-in 0.4s ease-out ${0.15 + i * 0.12}s both`,
              }}
            >
              <span className="w-7 h-7 rounded-full bg-brand-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span className="text-left">{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Grid of emoji + label — items pop in sequentially.

function IconGridVisual({ items = [], columns = 2 }) {
  const cols = columns === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid ${cols} gap-3 sm:gap-4 w-full`}>
      {items.map((it, i) => (
        <div
          key={i}
          className="bg-white border-2 border-ink-100 rounded-2xl p-4 sm:p-5 flex flex-col items-center text-center shadow-card hover:scale-105 hover:border-brand-blue transition-transform"
          style={{
            animation: `item-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both`,
          }}
        >
          <div
            className="text-6xl sm:text-7xl lg:text-8xl"
            style={{
              animation: `gentle-bob 3s ease-in-out infinite ${i * 0.2}s`,
              filter: "drop-shadow(0 6px 12px rgba(15,23,42,0.12))",
            }}
          >
            {it.emoji}
          </div>
          <div
            className="text-sm sm:text-base lg:text-lg font-bold text-ink-900 mt-2"
            style={{ fontFamily: "Fredoka, system-ui, sans-serif" }}
          >
            {it.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Acronym — letters as colored squares + meanings list. Letters pop in
// sequentially; the active letter (if highlighted) scales up with a ring.

function AcronymVisual({ word = "", meanings = [], highlight }) {
  const letters = word.replace(/\s+/g, "").split("");
  const tints = [
    "bg-blue-100 text-brand-blue border-blue-300",
    "bg-orange-100 text-brand-orange-dark border-orange-300",
    "bg-emerald-100 text-emerald-700 border-emerald-300",
    "bg-rose-100 text-rose-700 border-rose-300",
    "bg-violet-100 text-violet-700 border-violet-300",
    "bg-amber-100 text-amber-700 border-amber-300",
    "bg-cyan-100 text-cyan-700 border-cyan-300",
  ];
  return (
    <div className="flex flex-col items-center gap-4 w-full">
      <div className="flex gap-2 sm:gap-3 flex-wrap justify-center">
        {letters.map((ch, i) => {
          const isActive =
            highlight && meanings[i]?.toLowerCase() === highlight.toLowerCase();
          return (
            <div
              key={i}
              className={[
                "w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 rounded-2xl border-2 flex items-center justify-center text-3xl sm:text-4xl lg:text-5xl font-extrabold shadow-lg",
                tints[i % tints.length],
                isActive ? "ring-4 ring-brand-blue scale-110" : "",
              ].join(" ")}
              style={{
                animation: `item-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s both, gentle-bob 3.5s ease-in-out ${i * 0.2}s infinite`,
                fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif",
              }}
            >
              {ch}
            </div>
          );
        })}
      </div>
      {meanings.length > 0 && (
        <div className="grid grid-cols-1 gap-1.5 w-full max-w-sm">
          {meanings.map((m, i) => {
            const isActive =
              highlight && m.toLowerCase() === highlight.toLowerCase();
            return (
              <div
                key={i}
                className={[
                  "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm",
                  isActive
                    ? "bg-brand-blue/10 font-semibold text-brand-blue"
                    : "bg-white text-ink-700 border border-ink-100",
                ].join(" ")}
                style={{
                  animation: `step-in 0.4s ease-out ${0.3 + i * 0.08}s both`,
                }}
              >
                <span
                  className={[
                    "w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold",
                    tints[i % tints.length].split(" ").slice(0, 2).join(" "),
                  ].join(" ")}
                >
                  {letters[i]}
                </span>
                {m}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Big banner — for intro / summary slides. HUGE animated icon, playful
// font on the label, so the visual area never feels empty.

function BannerVisual({ icon, label, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-4 text-center w-full justify-center h-full">
      <div
        className="text-[11rem] sm:text-[13rem] lg:text-[15rem] leading-none animate-[bounce-soft_2.4s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 12px 24px rgba(30, 58, 138, 0.3))" }}
      >
        {icon}
      </div>
      <div
        className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-brand-blue"
        style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
      >
        {label}
      </div>
      {subtitle && (
        <div className="text-sm sm:text-base text-ink-500 max-w-[22rem]">
          {subtitle}
        </div>
      )}
    </div>
  );
}
