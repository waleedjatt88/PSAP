import mascotImg from "../assets/AI_Lesson.png";

// Animated AI tutor avatar. Two visual states:
// - idle:    gentle bounce + soft halo
// - speaking: faster bounce, pulsing glow ring, active wave bars below
//
// Driven by CSS keyframes defined in src/index.css. No external libs.
//
// Props:
//   speaking: boolean — true when the teleprompter is mid-sentence
//   size: "xl" | "lg" | "md"  (default "lg")
//   caption: optional short label rendered under the avatar
export default function TalkingAvatar({ speaking = false, size = "lg", caption }) {
  const dim = {
    xl: "w-56 h-56",
    lg: "w-44 h-44",
    md: "w-32 h-32",
  }[size];

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className={`relative ${dim} flex items-center justify-center`}>
        {/* Outer pulsing glow — visible only while speaking */}
        <div
          className={[
            "absolute inset-0 rounded-full",
            speaking
              ? "bg-brand-blue/20 animate-[avatar-pulse_1.6s_ease-in-out_infinite]"
              : "bg-brand-blue/5",
          ].join(" ")}
        />
        {/* Inner halo */}
        <div
          className={[
            "absolute inset-4 rounded-full bg-gradient-to-br",
            speaking
              ? "from-blue-200 to-orange-200"
              : "from-blue-100 to-orange-100",
          ].join(" ")}
        />
        {/* The mascot itself — bobs subtly to feel alive */}
        <img
          src={mascotImg}
          alt="PassPoint AI Tutor"
          className={[
            "relative w-full h-full object-contain drop-shadow-lg",
            speaking
              ? "animate-[avatar-bob-fast_0.7s_ease-in-out_infinite]"
              : "animate-[avatar-bob_3.5s_ease-in-out_infinite]",
          ].join(" ")}
          draggable={false}
        />
        {/* Status ring */}
        <div
          className={[
            "absolute -bottom-1 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1 shadow-card whitespace-nowrap",
            speaking
              ? "bg-emerald-500 text-white"
              : "bg-white text-ink-500 border border-ink-100",
          ].join(" ")}
        >
          <span
            className={[
              "w-1.5 h-1.5 rounded-full",
              speaking ? "bg-white animate-ping" : "bg-ink-300",
            ].join(" ")}
          />
          {speaking ? "Speaking" : "Listening"}
        </div>
      </div>

      {/* Audio-wave bars under the avatar */}
      <WaveBars active={speaking} />

      {caption && (
        <div className="text-xs text-ink-500 text-center max-w-[14rem]">
          {caption}
        </div>
      )}
    </div>
  );
}

function WaveBars({ active }) {
  const heights = [8, 14, 20, 16, 24, 12, 18, 10, 22, 14, 8];
  return (
    <div className="flex items-end gap-0.5 h-7">
      {heights.map((h, i) => (
        <span
          key={i}
          className={[
            "w-1 rounded-full",
            active ? "bg-brand-blue wave-bar" : "bg-ink-300",
          ].join(" ")}
          style={{
            height: `${active ? h : Math.max(4, h / 3)}px`,
            animationDelay: active ? `${i * 70}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}
