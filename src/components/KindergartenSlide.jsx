// Slide layout for Kindergarten lessons. Designed to be ~90% visual
// and ~10% text — opposite of the JSS slide. The whole stage IS the
// visual; the heading and active sentence sit on top in big, friendly
// type. Each visual type has its own scene:
//
//   { type: "kg-letter",  letter, word, emoji, photoHint? }
//                                              — A for Apple (real DALL-E photo)
//   { type: "kg-number",  n, word, emoji, color }        — counting
//   { type: "kg-object",  name, emoji, color, photoHint? } — what is this? (real photo)
//   { type: "kg-shape",   name, shape, emoji, color }    — circle/square/...
//   { type: "kg-banner",  icon, label, color, blocks? }   — intro / outro

import LetterPhotoScene from "./LetterPhotoScene.jsx";
import LetterLessonScene from "./LetterLessonScene.jsx";
import NumberLessonScene from "./NumberLessonScene.jsx";
import ShapeLessonScene from "./ShapeLessonScene.jsx";
import { numberImage } from "../data/lessons/numberAssets.js";
import { shapeImage } from "../data/lessons/shapeAssets.js";
import WelcomeScene from "./WelcomeScene.jsx";
import ObjectPhotoScene from "./ObjectPhotoScene.jsx";
import { ArrowLeftIcon, ArrowRightIcon } from "./icons.jsx";

export default function KindergartenSlide({
  section,
  sectionStartIdx,
  currentIdx,
  slideNumber,
  totalSlides,
  subject,
  topic,
  speaking = false,
  onPrevSlide,
  onNextSlide,
  canPrev = false,
  canNext = false,
  onSentenceClick,
  onReplay,
}) {
  if (!section) return null;
  const visual = section.visual || {};
  const isLetter = visual.type === "kg-letter";
  const isBanner = visual.type === "kg-banner";
  const isObject = visual.type === "kg-object";
  // Numbers/shapes with dedicated artwork render full-bleed like the
  // letters; the rest fall back to their CSS scenes below.
  const isNumberPhoto = visual.type === "kg-number" && !!numberImage(visual.n);
  const isShapePhoto = visual.type === "kg-shape" && !!shapeImage(visual.shape);
  const isFullBleed = isLetter || isBanner || isObject || isNumberPhoto || isShapePhoto;

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
        "relative h-full w-full rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.6)] overflow-hidden flex flex-col",
        "bg-[#0e0c24] border border-purple-500/15",
        "slide-enter",
      ].join(" ")}
      style={{ fontFamily: "Fredoka, 'Baloo 2', 'Comic Sans MS', system-ui, sans-serif" }}
    >
      {/* Soft ambient tint so the dark stage doesn't feel flat */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/10 via-transparent to-purple-600/10 pointer-events-none" />

      {/* Drifting bubbles in the background — pure decoration (dark scenes only) */}
      {!isFullBleed && <BgBubbles />}

      {/* Alphabet letters: full-bleed composed illustration + avatar */}
      {isLetter && (
        <LetterLessonScene
          letter={visual.letter}
          word={visual.word}
          emoji={visual.emoji}
        />
      )}

      {/* Numbers with artwork: full-bleed composed illustration + avatar */}
      {isNumberPhoto && (
        <NumberLessonScene n={visual.n} word={visual.word} emoji={visual.emoji} />
      )}

      {/* Shapes with artwork: full-bleed composed illustration + avatar */}
      {isShapePhoto && (
        <ShapeLessonScene
          name={visual.name}
          shape={visual.shape}
          emoji={visual.emoji}
          example={visual.example}
        />
      )}

      {/* Intro / outro: full-bleed 3D welcome scene */}
      {isBanner && (
        <WelcomeScene icon={visual.icon} label={visual.label} blocks={visual.blocks} />
      )}

      {/* Objects / body parts: full-bleed real photo card */}
      {isObject && (
        <ObjectPhotoScene
          name={visual.name}
          emoji={visual.emoji}
          photoHint={visual.photoHint}
        />
      )}

      {/* Top capsule — slide counter only */}
      <div className="relative z-20 px-4 sm:px-6 py-3 flex items-center justify-end">
        <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-full px-3 sm:px-4 py-1.5 flex items-center shadow-lg shrink-0">
          <span className="text-[11px] font-extrabold text-white tracking-widest font-mono tabular-nums">
            {slideNumber} / {totalSlides}
          </span>
        </div>
      </div>

      {/* Main scene — fills the rest of the slide. For alphabet letters the
          scene is rendered full-bleed above, so this is just a spacer that
          keeps the caption bar pinned to the bottom. */}
      <div className="flex-1 relative z-10 flex items-center justify-center min-h-0 px-6 py-2">
        {!isFullBleed && <Scene visual={visual} onReplay={onReplay} />}
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

      {/* Caption bar at the bottom — animated soundwave + the active
          sentence in big, tappable text */}
      <div className="relative z-20 px-6 pb-4 flex justify-center">
        <button
          onClick={() => onSentenceClick?.(sectionStartIdx)}
          className="max-w-md bg-black/40 backdrop-blur-md border border-white/10 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.5)] rounded-2xl px-5 py-2.5 flex flex-col items-center gap-1.5"
        >
          <SoundWave active={speaking} />
          <div className="text-base sm:text-lg md:text-xl font-bold text-white leading-snug text-center drop-shadow">
            {activeSentence}
          </div>
        </button>
      </div>
    </div>
  );
}

// Pulsating multicolour soundwave shown in the caption bar while the AI
// teacher is speaking. Purely cosmetic — mirrors the presenter's audio.
function SoundWave({ active }) {
  const heights = [3, 6, 9, 12, 14, 10, 6, 8, 12, 16, 12, 8, 5, 10, 14, 8, 4, 2];
  return (
    <div className="flex items-center justify-center gap-[3px] h-4">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{
            height: active ? `${h * 1.4}px` : "3px",
            animationDelay: active ? `${(i % 6) * 0.15}s` : undefined,
          }}
          className={[
            "w-[2.5px] rounded-full transition-all duration-300",
            active ? "sound-bar" : "",
            i % 3 === 0
              ? "bg-purple-400"
              : i % 2 === 0
                ? "bg-pink-400"
                : "bg-sky-400",
          ].join(" ")}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Per-visual scenes — each is its own little world.

function Scene({ visual, onReplay }) {
  switch (visual.type) {
    case "kg-letter":
      // Real photo + video scene; "Talk to me" was removed in favor of
      // the always-on direct voice loop wired in pages/Lesson.jsx.
      return <LetterPhotoScene {...visual} onReplay={onReplay} />;
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
          className="text-[5rem] sm:text-[7rem] font-extrabold text-gray-300/80 leading-none -mt-3"
          style={{ WebkitTextStroke: "2px rgba(255,255,255,0.1)" }}
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

// Glossy toy palette per digit — face gradient + darker extrusion side,
// matching the colourful 3D letters from the alphabet illustrations.
const NUMBER_3D_COLORS = {
  1: { light: "#fca5a5", face: "#ef4444", dark: "#991b1b" },
  2: { light: "#fcd34d", face: "#f59e0b", dark: "#92400e" },
  3: { light: "#f9a8d4", face: "#ec4899", dark: "#9d174d" },
  4: { light: "#fdba74", face: "#f97316", dark: "#9a3412" },
  5: { light: "#fde047", face: "#eab308", dark: "#854d0e" },
  6: { light: "#bef264", face: "#84cc16", dark: "#3f6212" },
  7: { light: "#6ee7b7", face: "#10b981", dark: "#065f46" },
  8: { light: "#5eead4", face: "#14b8a6", dark: "#115e59" },
  9: { light: "#67e8f9", face: "#06b6d4", dark: "#155e75" },
  10: { light: "#7dd3fc", face: "#0ea5e9", dark: "#075985" },
};

// Layered text-shadows that fake a chunky 3D extrusion behind the digit.
function extrusionShadow(dark) {
  const layers = Array.from({ length: 12 }, (_, i) => `${i + 1}px ${i + 1.5}px 0 ${dark}`);
  layers.push("0 34px 40px rgba(0,0,0,0.55)");
  return layers.join(", ");
}

// Big number on one side, that many objects arranged on the other
function NumberScene({ n, word, emoji }) {
  const c = NUMBER_3D_COLORS[n] || NUMBER_3D_COLORS[1];
  return (
    <div className="flex items-center justify-center gap-6 sm:gap-12 w-full max-w-5xl">
      <div className="flex flex-col items-center animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]" style={{ perspective: "900px" }}>
        <div
          className="relative leading-none animate-[number-3d_3.2s_ease-in-out_infinite]"
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Extruded base — solid colour + stacked shadows for depth */}
          <div
            className="text-[12rem] sm:text-[18rem] md:text-[22rem] font-extrabold leading-none tabular-nums"
            style={{ color: c.face, textShadow: extrusionShadow(c.dark) }}
          >
            {n}
          </div>
          {/* Glossy face — gradient clipped to the same glyph, stacked on top */}
          <div
            aria-hidden
            className="absolute inset-0 text-[12rem] sm:text-[18rem] md:text-[22rem] font-extrabold leading-none tabular-nums"
            style={{
              backgroundImage: `linear-gradient(160deg, #ffffff 0%, ${c.light} 22%, ${c.face} 58%, ${c.dark} 105%)`,
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            {n}
          </div>
        </div>
        <div
          className="text-3xl sm:text-5xl font-extrabold mt-4"
          style={{ color: c.light, textShadow: `2px 3px 0 ${c.dark}, 0 10px 18px rgba(0,0,0,0.4)` }}
        >
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
      <div className="animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <div
          className="text-[14rem] sm:text-[20rem] md:text-[26rem] leading-none animate-[bounce-soft_2.4s_ease-in-out_infinite]"
          style={{ filter: "drop-shadow(0 14px 28px rgba(15,23,42,0.25))" }}
        >
          {emoji}
        </div>
      </div>
      <div
        className="text-4xl sm:text-6xl md:text-7xl font-extrabold text-white drop-shadow-lg uppercase tracking-wide animate-[step-in_0.4s_ease-out_0.15s_both]"
        style={{ WebkitTextStroke: "3px rgba(15,23,42,0.15)" }}
      >
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
      <div className="flex flex-col items-center animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        <div className="w-[14rem] h-[14rem] sm:w-[20rem] sm:h-[20rem] md:w-[24rem] md:h-[24rem] flex items-center justify-center animate-[bounce-soft_2.4s_ease-in-out_infinite]"
          style={{ filter: "drop-shadow(0 10px 24px rgba(15,23,42,0.25))" }}>
          <ShapeSVG shape={shape} />
        </div>
        <div className="text-3xl sm:text-5xl font-extrabold text-white drop-shadow-lg uppercase tracking-wide mt-2"
          style={{ WebkitTextStroke: "2px rgba(15,23,42,0.15)" }}>
          {name}
        </div>
      </div>
      <div className="animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_0.15s_both]">
        <div
          className="text-[8rem] sm:text-[12rem] md:text-[16rem] leading-none animate-[gentle-bob_3s_ease-in-out_infinite]"
          style={{ filter: "drop-shadow(0 10px 20px rgba(15,23,42,0.2))" }}
        >
          {emoji}
        </div>
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
          className="absolute rounded-full bg-white/5 animate-[float_5s_ease-in-out_infinite]"
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
