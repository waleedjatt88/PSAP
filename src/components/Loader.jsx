// Loader — the one reusable loading indicator for the whole site: a
// pulsing glow halo behind two counter-rotating gradient rings, an
// orbiting spark, and a gently bobbing PassPoint mark in the center.
// Usage:
//   <Loader />                         — compact, no label
//   <Loader label="Fetching…" />       — compact, with bouncing-dot caption
//   <Loader fullScreen />              — full-page loading screen
//   <Loader size={16} withLogo={false} /> — tiny inline spinner (buttons)
import Logo from "./Logo";

export default function Loader({ fullScreen = false, label, size = 72, withLogo = true, className = "" }) {
  const text = label ?? (fullScreen ? "Loading" : null);
  const innerInset = Math.max(2, size * 0.16);

  const spinner = (
    <div className={`relative shrink-0 ${className}`} style={{ width: size, height: size }}>
      {/* Soft pulsing glow halo behind everything */}
      <div
        className="absolute -inset-2 rounded-full blur-md animate-[avatar-pulse_2s_ease-in-out_infinite]"
        style={{ background: "radial-gradient(circle, rgba(124,58,237,0.55), transparent 70%)" }}
      />

      {/* Outer ring — spins clockwise */}
      <div
        className="absolute inset-0 rounded-full animate-spin"
        style={{
          background: "conic-gradient(from 0deg, #7c3aed, #4f46e5, #ec4899, transparent 75%)",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
          animationDuration: "1s",
        }}
      />

      {/* Inner ring — spins counter-clockwise, different colour + speed */}
      <div
        className="absolute rounded-full animate-[spin-reverse_1.6s_linear_infinite]"
        style={{
          inset: innerInset,
          background: "conic-gradient(from 180deg, #38bdf8, #7c3aed, transparent 65%)",
          WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
          mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), #000 0)",
        }}
      />

      {/* Orbiting spark riding the outer ring */}
      <div className="absolute inset-0 animate-spin" style={{ animationDuration: "1s" }}>
        <span
          className="absolute rounded-full bg-white"
          style={{
            width: Math.max(4, size * 0.07),
            height: Math.max(4, size * 0.07),
            top: -Math.max(1, size * 0.01),
            left: "50%",
            transform: "translateX(-50%)",
            boxShadow: "0 0 8px 2px rgba(255,255,255,0.85)",
          }}
        />
      </div>

      {withLogo && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="bg-white rounded-full p-1.5 shadow-lg animate-[bounce-soft_2.4s_ease-in-out_infinite]">
            <Logo withText={false} size={size * 0.4} />
          </div>
        </div>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center gap-5 bg-[#070518] overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none animate-[avatar-pulse_5s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none animate-[avatar-pulse_5s_ease-in-out_infinite_1s]" />
        {spinner}
        {text && <LoaderLabel text={text} />}
      </div>
    );
  }

  if (!text) return spinner;

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-6">
      {spinner}
      <LoaderLabel text={text} />
    </div>
  );
}

function LoaderLabel({ text }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-semibold text-gray-400 tracking-wide">{text}</span>
      <span className="flex items-center gap-1">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1 h-1 rounded-full bg-purple-400 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </span>
    </div>
  );
}
