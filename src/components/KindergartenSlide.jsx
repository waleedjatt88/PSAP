// Slide layout for Kindergarten lessons. Designed to be ~90% visual
// and ~10% text — opposite of the JSS slide. The whole stage IS the
// visual; the heading and active sentence sit on top in big, friendly
// type. Each visual type has its own scene:
//
//   { type: "kg-letter",  letter, word, emoji, color }   — A for Apple
//   { type: "kg-number",  n, word, emoji, color }        — counting
//   { type: "kg-object",  name, emoji, color }           — what is this?
//   { type: "kg-shape",   name, shape, emoji, color }    — circle/square/...
//   { type: "kg-banner",  icon, label, color }           — intro / outro

export default function KindergartenSlide({
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
  const visual = section.visual || {};
  const colorClass = visual.color || "from-blue-100 to-purple-100";

  // Find the live sentence (if this section is active) — shown as a
  // single big speech-bubble caption at the bottom.
  const activeSentence =
    currentIdx >= sectionStartIdx &&
    currentIdx < sectionStartIdx + (section.sentences?.length || 0)
      ? section.sentences[currentIdx - sectionStartIdx]
      : section.sentences?.[0];

  return (
    <div
      key={section.id}
      className={[
        "relative h-full w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col",
        "bg-gradient-to-br",
        colorClass,
        "slide-enter",
      ].join(" ")}
      style={{ fontFamily: "Fredoka, 'Baloo 2', 'Comic Sans MS', system-ui, sans-serif" }}
    >
      {/* Drifting bubbles in the background — pure decoration */}
      <BgBubbles />

      {/* Tiny header — subject + slide counter */}
      <div className="relative z-10 px-6 py-3 flex items-center justify-between text-white">
        <div className="bg-white/30 backdrop-blur px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-ink-900">
          {subject} · {topic}
        </div>
        <div className="bg-white/30 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-ink-900 font-mono tabular-nums">
          {slideNumber} / {totalSlides}
        </div>
      </div>

      {/* Main scene — fills the rest of the slide */}
      <div className="flex-1 relative z-10 flex items-center justify-center min-h-0 px-6 py-2">
        <Scene visual={visual} />
      </div>

      {/* Caption bubble at the bottom — shows the active sentence in big,
          tappable text */}
      <div className="relative z-10 px-6 pb-4 flex justify-center">
        <button
          onClick={() => onSentenceClick?.(sectionStartIdx)}
          className="bg-white/95 backdrop-blur shadow-2xl rounded-full px-6 py-3 text-center max-w-2xl"
        >
          <div className="text-xl sm:text-2xl md:text-3xl font-bold text-ink-900 leading-snug">
            {activeSentence}
          </div>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Per-visual scenes — each is its own little world.

function Scene({ visual }) {
  switch (visual.type) {
    case "kg-letter":
      return <LetterScene {...visual} />;
    case "kg-number":
      return <NumberScene {...visual} />;
    case "kg-object":
      return <ObjectScene {...visual} />;
    case "kg-shape":
      return <ShapeScene {...visual} />;
    case "kg-banner":
    default:
      return <BannerScene {...visual} />;
  }
}

// Big letter on the left, big object on the right
function LetterScene({ letter, word, emoji }) {
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-10 w-full max-w-5xl">
      <div className="flex flex-col items-center">
        <div
          className="text-[10rem] sm:text-[14rem] md:text-[18rem] font-extrabold text-white drop-shadow-2xl leading-none animate-[bounce-soft_2.4s_ease-in-out_infinite]"
          style={{ WebkitTextStroke: "4px rgba(15,23,42,0.15)" }}
        >
          {letter}
        </div>
        <div
          className="text-[5rem] sm:text-[7rem] font-extrabold text-ink-700/70 leading-none -mt-3"
          style={{ WebkitTextStroke: "2px rgba(15,23,42,0.1)" }}
        >
          {letter.toLowerCase()}
        </div>
      </div>
      <div className="text-[8rem] sm:text-[12rem] md:text-[16rem] leading-none animate-[gentle-bob_3s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 10px 20px rgba(15,23,42,0.2))" }}>
        {emoji}
      </div>
    </div>
  );
}

// Big number on one side, that many objects arranged on the other
function NumberScene({ n, word, emoji }) {
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-12 w-full max-w-5xl">
      <div className="flex flex-col items-center">
        <div
          className="text-[12rem] sm:text-[18rem] md:text-[22rem] font-extrabold text-white drop-shadow-2xl leading-none animate-[bounce-soft_2.4s_ease-in-out_infinite] tabular-nums"
          style={{ WebkitTextStroke: "5px rgba(15,23,42,0.15)" }}
        >
          {n}
        </div>
        <div className="text-3xl sm:text-5xl font-extrabold text-ink-700 mt-2">
          {word}
        </div>
      </div>
      <div className="grid gap-2 sm:gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(n, 5)}, minmax(0, 1fr))` }}>
        {Array.from({ length: n }).map((_, i) => (
          <div
            key={i}
            className="text-4xl sm:text-6xl md:text-7xl leading-none animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]"
            style={{
              animationDelay: `${i * 120}ms`,
              filter: "drop-shadow(0 6px 12px rgba(15,23,42,0.15))",
            }}
          >
            {emoji}
          </div>
        ))}
      </div>
    </div>
  );
}

// One ENORMOUS object dominating the screen
function ObjectScene({ name, emoji }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full">
      <div
        className="text-[14rem] sm:text-[20rem] md:text-[26rem] leading-none animate-[bounce-soft_2.4s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 14px 28px rgba(15,23,42,0.25))" }}
      >
        {emoji}
      </div>
      <div className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-lg uppercase tracking-wide"
        style={{ WebkitTextStroke: "3px rgba(15,23,42,0.15)" }}>
        {name}
      </div>
    </div>
  );
}

// Big drawn shape on one side, real-world example emoji on the other.
// Mirrors NumberScene's "big number + counting objects" layout.
function ShapeScene({ name, shape, emoji }) {
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-12 w-full max-w-5xl">
      <div className="flex flex-col items-center">
        <div className="w-[14rem] h-[14rem] sm:w-[20rem] sm:h-[20rem] md:w-[24rem] md:h-[24rem] flex items-center justify-center animate-[bounce-soft_2.4s_ease-in-out_infinite]"
          style={{ filter: "drop-shadow(0 10px 24px rgba(15,23,42,0.25))" }}>
          <ShapeSVG shape={shape} />
        </div>
        <div className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg uppercase tracking-wide mt-2"
          style={{ WebkitTextStroke: "2px rgba(15,23,42,0.15)" }}>
          {name}
        </div>
      </div>
      <div
        className="text-[8rem] sm:text-[12rem] md:text-[16rem] leading-none animate-[gentle-bob_3s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 10px 20px rgba(15,23,42,0.2))" }}
      >
        {emoji}
      </div>
    </div>
  );
}

// Pure SVG drawings of each named shape, in a chunky white fill with
// a soft ink outline so they pop on the gradient background.
function ShapeSVG({ shape }) {
  const stroke = "rgba(15,23,42,0.25)";
  const strokeWidth = 6;
  const fill = "#ffffff";
  const common = { fill, stroke, strokeWidth, strokeLinejoin: "round" };
  switch (shape) {
    case "circle":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="86" {...common} />
        </svg>
      );
    case "square":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect x="20" y="20" width="160" height="160" rx="8" {...common} />
        </svg>
      );
    case "triangle":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <polygon points="100,20 184,176 16,176" {...common} />
        </svg>
      );
    case "rectangle":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <rect x="10" y="50" width="180" height="100" rx="8" {...common} />
        </svg>
      );
    case "star":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <polygon
            points="100,12 124,76 192,80 138,124 158,190 100,152 42,190 62,124 8,80 76,76"
            {...common}
          />
        </svg>
      );
    case "heart":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <path
            d="M100 176 C 30 130, 10 80, 50 50 C 80 28, 100 56, 100 72 C 100 56, 120 28, 150 50 C 190 80, 170 130, 100 176 Z"
            {...common}
          />
        </svg>
      );
    case "diamond":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <polygon points="100,16 184,100 100,184 16,100" {...common} />
        </svg>
      );
    case "oval":
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <ellipse cx="100" cy="100" rx="86" ry="60" {...common} />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 200 200" className="w-full h-full">
          <circle cx="100" cy="100" r="86" {...common} />
        </svg>
      );
  }
}

// Intro / outro slide
function BannerScene({ icon, label }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 w-full text-center">
      <div
        className="text-[14rem] sm:text-[20rem] md:text-[26rem] leading-none animate-[bounce-soft_2.4s_ease-in-out_infinite]"
        style={{ filter: "drop-shadow(0 14px 28px rgba(15,23,42,0.25))" }}
      >
        {icon}
      </div>
      <div className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white drop-shadow-lg max-w-3xl px-4"
        style={{ WebkitTextStroke: "3px rgba(15,23,42,0.15)" }}>
        {label}
      </div>
    </div>
  );
}

// Floating bubbles in the background — pure cosmetic
function BgBubbles() {
  const bubbles = [
    { left: "8%", top: "12%", size: "120px", delay: "0s" },
    { left: "82%", top: "18%", size: "80px", delay: "0.5s" },
    { left: "20%", top: "75%", size: "100px", delay: "1s" },
    { left: "70%", top: "70%", size: "140px", delay: "1.5s" },
    { left: "45%", top: "8%", size: "60px", delay: "2s" },
  ];
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {bubbles.map((b, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white/40 animate-[float_5s_ease-in-out_infinite]"
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
