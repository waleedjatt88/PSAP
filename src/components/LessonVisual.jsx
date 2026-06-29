// Per-slide visual aid — like the diagrams a teacher would point at on a
// chalkboard. Each lesson section can supply a `visual` object that picks
// one of these renderers:
//
//   { type: "pie",       num, den }
//   { type: "mixed-pies", whole, num, den }
//   { type: "two-pies",  a:{num,den}, b:{num,den} }       — for equivalence
//   { type: "math",      expression: "9 ÷ 4 = 2 r 1" }
//   { type: "icon-grid", items: [{emoji, label}, ...] }
//   { type: "acronym",   word: "MRS GREN", meanings: [...] }
//   { type: "banner",    icon: "🧮", label: "..." }
//
// All renderers are pure SVG / Tailwind so they look crisp at any size
// and never depend on external image hosts.

export default function LessonVisual({ visual }) {
  if (!visual) return null;
  switch (visual.type) {
    case "pie":
      return <PieVisual num={visual.num} den={visual.den} label={visual.label} />;
    case "mixed-pies":
      return <MixedPiesVisual whole={visual.whole} num={visual.num} den={visual.den} />;
    case "two-pies":
      return <TwoPiesVisual a={visual.a} b={visual.b} note={visual.note} />;
    case "math":
      return <MathVisual expression={visual.expression} steps={visual.steps} />;
    case "icon-grid":
      return <IconGridVisual items={visual.items} columns={visual.columns} />;
    case "acronym":
      return <AcronymVisual word={visual.word} meanings={visual.meanings} highlight={visual.highlight} />;
    case "banner":
      return <BannerVisual icon={visual.icon} label={visual.label} subtitle={visual.subtitle} />;
    default:
      return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Pie chart — colored slices for `num / den`. Used for fractions.

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
      />,
    );
  }
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 200 200" className="w-48 h-48">
        {slices}
      </svg>
      <div className="text-center">
        <div className="text-4xl font-extrabold text-brand-blue tabular-nums">
          {num}/{den}
        </div>
        {label && (
          <div className="text-xs text-ink-500 mt-1">{label}</div>
        )}
      </div>
    </div>
  );
}

// One full pie + a partial pie — used for improper / mixed fractions.

function MixedPiesVisual({ whole, num, den }) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-end gap-3 flex-wrap justify-center">
        {Array.from({ length: whole }).map((_, i) => (
          <PieMini key={i} num={den} den={den} />
        ))}
        {num > 0 && <PieMini num={num} den={den} />}
      </div>
      <div className="text-center">
        <div className="text-3xl font-extrabold text-brand-blue">
          {whole}
          <span className="text-2xl">
            {" "}
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
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-4">
        <PieMini num={a.num} den={a.den} size={120} />
        <div className="text-3xl text-brand-blue font-bold">=</div>
        <PieMini num={b.num} den={b.den} size={120} />
      </div>
      <div className="text-center text-lg font-bold text-brand-blue tabular-nums">
        {a.num}/{a.den} = {b.num}/{b.den}
      </div>
      {note && <div className="text-xs text-ink-500">{note}</div>}
    </div>
  );
}

function PieMini({ num, den, size = 90 }) {
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
      className="shrink-0"
    >
      {slices}
    </svg>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Math expression — big and readable

function MathVisual({ expression, steps }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="text-2xl md:text-4xl font-bold text-brand-blue px-4 py-6 bg-blue-50 border-2 border-blue-200 rounded-2xl tabular-nums">
        {expression}
      </div>
      {steps?.length > 0 && (
        <div className="space-y-1.5 mt-2">
          {steps.map((s, i) => (
            <div key={i} className="text-sm text-ink-700 flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-brand-blue text-white text-[10px] flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Grid of emoji + label — for showing examples (animals / objects / etc.)

function IconGridVisual({ items = [], columns = 2 }) {
  const cols = columns === 3 ? "grid-cols-3" : "grid-cols-2";
  return (
    <div className={`grid ${cols} gap-3 w-full`}>
      {items.map((it, i) => (
        <div
          key={i}
          className="bg-white border-2 border-ink-100 rounded-xl p-3 flex flex-col items-center text-center"
        >
          <div className="text-4xl">{it.emoji}</div>
          <div className="text-xs font-semibold text-ink-900 mt-1">{it.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// Acronym — each letter as a colored square + its meaning.
// Optionally highlight one letter (when the lesson is on that letter).

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
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex gap-1.5 flex-wrap justify-center">
        {letters.map((ch, i) => {
          const isActive =
            highlight && meanings[i]?.toLowerCase() === highlight.toLowerCase();
          return (
            <div
              key={i}
              className={[
                "w-12 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-extrabold transition-all",
                tints[i % tints.length],
                isActive ? "ring-4 ring-brand-blue scale-110 shadow-lg" : "",
              ].join(" ")}
            >
              {ch}
            </div>
          );
        })}
      </div>
      {meanings.length > 0 && (
        <div className="grid grid-cols-1 gap-1 w-full max-w-xs text-xs">
          {meanings.map((m, i) => {
            const isActive =
              highlight && m.toLowerCase() === highlight.toLowerCase();
            return (
              <div
                key={i}
                className={[
                  "flex items-center gap-2 rounded-lg px-2 py-1",
                  isActive ? "bg-brand-blue/10 font-semibold text-brand-blue" : "text-ink-700",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold",
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
// Big banner — for intro / summary slides

function BannerVisual({ icon, label, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div className="text-7xl">{icon}</div>
      <div className="text-xl font-extrabold text-brand-blue">{label}</div>
      {subtitle && (
        <div className="text-xs text-ink-500 max-w-[14rem]">{subtitle}</div>
      )}
    </div>
  );
}
