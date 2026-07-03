// Intro / outro "banner" scene, shared by every Kindergarten subject —
// a bright, playful 3D-style welcome built with CSS/SVG (sky + sun +
// clouds + bouncing 3D chips + the pointing teacher). The three floating
// chips are content-aware: pass `blocks` (up to 3 short strings/emoji)
// so the scene matches the lesson (letters for the alphabet, numbers for
// counting, shape glyphs for shapes, etc). Falls back to "ABC" when no
// blocks are given. Rendered full-bleed by KindergartenSlide, with the
// caption bar + chrome floating on top.

import useChromaKey from "../hooks/useChromaKey.js";
import { TEACHER_POINTED } from "../data/lessons/alphabetAssets.js";

const BLOCK_PALETTE = [
  { grad: "from-rose-400 to-red-500", edge: "#b91c1c", rot: "-8deg", delay: "0s" },
  { grad: "from-sky-400 to-blue-500", edge: "#1d4ed8", rot: "5deg", delay: "0.25s" },
  { grad: "from-emerald-400 to-green-500", edge: "#15803d", rot: "-4deg", delay: "0.5s" },
];

const DEFAULT_BLOCKS = ["A", "B", "C"];

const STARS = [
  { top: "16%", left: "34%", size: 18, delay: "0s" },
  { top: "24%", left: "70%", size: 14, delay: "0.4s" },
  { top: "12%", left: "58%", size: 12, delay: "0.8s" },
  { top: "40%", left: "30%", size: 12, delay: "1.1s" },
  { top: "50%", left: "90%", size: 16, delay: "0.6s" },
];

export default function WelcomeScene({ icon = "🎉", label = "Let's learn the ABC!", blocks }) {
  const avatar = useChromaKey(TEACHER_POINTED);
  const chars = blocks?.length ? blocks.slice(0, 3) : DEFAULT_BLOCKS;
  const BLOCKS = chars.map((ch, i) => ({ ch, ...BLOCK_PALETTE[i % BLOCK_PALETTE.length] }));

  return (
    <div
      className="absolute inset-0 overflow-hidden"
      style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
    >
      {/* Sky → meadow gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#5bc0f8] via-[#bae6fd] to-[#bbf7d0]" />

      {/* Sun with soft glow */}
      <div className="absolute top-6 right-[13%] w-24 h-24 rounded-full bg-gradient-to-br from-yellow-200 to-amber-400 shadow-[0_0_70px_rgba(251,191,36,0.85)]" />

      {/* Fluffy clouds */}
      <Cloud className="top-[13%] left-[14%]" />
      <Cloud className="top-[30%] left-[50%] opacity-90 scale-75" />
      <Cloud className="top-[8%] left-[72%] scale-90" />

      {/* Rolling grass hill at the bottom */}
      <div className="absolute -bottom-16 -inset-x-16 h-1/2 bg-gradient-to-t from-[#16a34a] to-[#4ade80] rounded-[50%] shadow-[inset_0_8px_20px_rgba(255,255,255,0.25)]" />

      {/* Twinkling sparkles */}
      {STARS.map((s, i) => (
        <span
          key={i}
          className="absolute text-yellow-300 animate-[float_5s_ease-in-out_infinite]"
          style={{
            top: s.top,
            left: s.left,
            fontSize: `${s.size}px`,
            animationDelay: s.delay,
            filter: "drop-shadow(0 0 6px rgba(250,204,21,0.8))",
          }}
        >
          ✦
        </span>
      ))}

      {/* Bouncing 3D chips — pop in on entrance, then bob forever */}
      <div className="absolute right-[7%] sm:right-[12%] top-1/2 -translate-y-1/2 flex items-center gap-2 sm:gap-4">
        {BLOCKS.map((b, i) => (
          <div
            key={b.ch}
            className="animate-[item-pop_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]"
            style={{ animationDelay: `${i * 140}ms` }}
          >
            <div style={{ transform: `rotate(${b.rot})` }}>
              <div
                className={`w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br ${b.grad} border-2 border-white/60 flex items-center justify-center animate-[bounce-soft_2.6s_ease-in-out_infinite]`}
                style={{
                  boxShadow: `0 10px 0 ${b.edge}, 0 22px 34px rgba(0,0,0,0.28)`,
                  animationDelay: b.delay,
                }}
              >
                <span
                  className="text-3xl sm:text-5xl font-black text-white"
                  style={{
                    WebkitTextStroke: "1.5px rgba(0,0,0,0.15)",
                    textShadow: "0 3px 0 rgba(0,0,0,0.2)",
                  }}
                >
                  {b.ch}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pointing teacher, flipped toward the blocks */}
      <div className="absolute bottom-0 left-0 h-[78%] max-w-[38%] animate-fade-in">
        <img
          src={avatar}
          alt="Aunty Adesua"
          className="h-full w-auto object-contain object-bottom origin-bottom animate-[teacher-idle_4s_ease-in-out_infinite] drop-shadow-[0_15px_35px_rgba(0,0,0,0.45)] pointer-events-none select-none"
          draggable={false}
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Title chip — fades/pops in on entrance */}
      <div className="absolute top-[7%] left-1/2 -translate-x-1/2 z-10 max-w-[85%]">
        <div className="bg-white/95 border border-white rounded-full px-4 sm:px-5 py-2 shadow-[0_12px_30px_-6px_rgba(0,0,0,0.4)] flex items-center gap-2 animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]">
          <span className="text-lg sm:text-2xl leading-none">{icon}</span>
          <span className="text-[#1e154b] font-black text-xs sm:text-base tracking-tight whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

// A soft, rounded CSS cloud.
function Cloud({ className = "" }) {
  return (
    <div className={`absolute ${className}`}>
      <div className="relative">
        <div className="w-24 h-8 bg-white/90 rounded-full shadow-sm" />
        <div className="absolute -top-4 left-4 w-12 h-12 bg-white/90 rounded-full" />
        <div className="absolute -top-3 left-12 w-10 h-10 bg-white/90 rounded-full" />
      </div>
    </div>
  );
}
