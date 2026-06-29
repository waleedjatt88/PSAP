// Per-slide visual aid — like the diagrams a teacher would point at on a
// chalkboard. Each lesson section can supply a `visual` object that picks
// one of these renderers. All visuals enter with a soft scale animation
// and idle-animate (float / pulse) so the slide feels alive.

export default function LessonVisual({ visual }) {
  if (!visual) return null;
  return (
    <div key={JSON.stringify(visual)} className="w-full animate-[visual-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)]">
      {renderInner(visual)}
    </div>
  );
}

function renderInner(visual) {
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
      <svg viewBox="0 0 200 200" className="w-64 h-64 lg:w-72 lg:h-72 drop-shadow-lg">
        {slices}
      </svg>
      <div className="text-center">
        <div className="text-6xl lg:text-7xl font-extrabold text-brand-blue tabular-nums leading-none">
          {num}/{den}
        </div>
        {label && (
          <div className="text-sm text-ink-500 mt-2 max-w-[16rem]">{label}</div>
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
      <div className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-brand-blue px-6 py-8 bg-gradient-to-br from-blue-50 to-orange-50 border-2 border-blue-200 rounded-2xl tabular-nums shadow-card animate-[float_4s_ease-in-out_infinite]">
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
    <div className={`grid ${cols} gap-3 w-full`}>
      {items.map((it, i) => (
        <div
          key={i}
          className="bg-white border-2 border-ink-100 rounded-xl p-4 flex flex-col items-center text-center shadow-card hover:scale-105 hover:border-brand-blue transition-transform"
          style={{ animation: `item-pop 0.5s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.08}s both` }}
        >
          <div
            className="text-5xl lg:text-6xl"
            style={{ animation: `gentle-bob 3s ease-in-out infinite ${i * 0.2}s` }}
          >
            {it.emoji}
          </div>
          <div className="text-sm lg:text-base font-semibold text-ink-900 mt-2">
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
      <div className="flex gap-2 flex-wrap justify-center">
        {letters.map((ch, i) => {
          const isActive =
            highlight && meanings[i]?.toLowerCase() === highlight.toLowerCase();
          return (
            <div
              key={i}
              className={[
                "w-14 h-14 lg:w-16 lg:h-16 rounded-xl border-2 flex items-center justify-center text-2xl lg:text-3xl font-extrabold shadow-md",
                tints[i % tints.length],
                isActive ? "ring-4 ring-brand-blue scale-110" : "",
              ].join(" ")}
              style={{
                animation: `item-pop 0.45s cubic-bezier(0.34,1.56,0.64,1) ${i * 0.1}s both`,
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
// Big banner — for intro / summary slides. Now uses a HUGE animated icon
// so the visual area never feels empty.

function BannerVisual({ icon, label, subtitle }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center w-full justify-center h-full">
      <div
        className="text-[9rem] lg:text-[11rem] leading-none animate-[bounce-soft_2.4s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 8px 16px rgba(30, 58, 138, 0.25))" }}
      >
        {icon}
      </div>
      <div className="text-3xl lg:text-4xl font-extrabold text-brand-blue">
        {label}
      </div>
      {subtitle && (
        <div className="text-sm lg:text-base text-ink-500 max-w-[18rem]">
          {subtitle}
        </div>
      )}
    </div>
  );
}
