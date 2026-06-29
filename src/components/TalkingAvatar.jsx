import { useState } from "react";
import mascotImg from "../assets/AI_Lesson.png";

// Realistic AI teacher avatar.
//
// Image resolution chain (first match wins):
//   1. /teacher-avatar.jpg — drop ANY photo at
//      passpoint-demo/public/teacher-avatar.jpg and it shows up here.
//      .png, .webp also work — see TEACHER_PATHS below.
//   2. DiceBear "personas" portrait — generated illustrated character.
//   3. Robot mascot bundled with the app — final safety net.
//
// To swap the teacher: save your preferred photo to
//   passpoint-demo/public/teacher-avatar.jpg
// then refresh the page — no code changes needed.
const TEACHER_PATHS = [
  "/teacher-avatar.jpg",
  "/teacher-avatar.jpeg",
  "/teacher-avatar.png",
  "/teacher-avatar.webp",
];

const DICEBEAR_URL = (seed) =>
  `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=320`;

const DEFAULT_SEED = "Mr+Adebayo+Teacher";

export default function TalkingAvatar({
  speaking = false,
  size = "lg",
  caption,
  presenterName = "AI Teacher",
  teacherSeed = DEFAULT_SEED,
  showNamePlate = false,
}) {
  // `srcIdx` walks the TEACHER_PATHS array; once exhausted we fall through
  // to DiceBear, and finally to the bundled robot mascot.
  const [srcIdx, setSrcIdx] = useState(0);
  const [usingDicebear, setUsingDicebear] = useState(false);
  const [usingMascot, setUsingMascot] = useState(false);

  function handleError() {
    if (srcIdx < TEACHER_PATHS.length - 1) {
      setSrcIdx(srcIdx + 1);
    } else if (!usingDicebear) {
      setUsingDicebear(true);
    } else if (!usingMascot) {
      setUsingMascot(true);
    }
  }

  const portraitSrc = usingMascot
    ? mascotImg
    : usingDicebear
      ? DICEBEAR_URL(teacherSeed)
      : TEACHER_PATHS[srcIdx];

  const dim = {
    xxl: "w-72 h-72",
    xl: "w-56 h-56",
    lg: "w-44 h-44",
    md: "w-32 h-32",
    sm: "w-24 h-24",
  }[size];

  return (
    <div className="flex flex-col items-center gap-3 select-none">
      <div className={`relative ${dim} flex items-center justify-center`}>
        {/* Outer pulsing glow — visible only while speaking */}
        <div
          className={[
            "absolute inset-0 rounded-full",
            speaking
              ? "bg-brand-blue/30 animate-[avatar-pulse_1.6s_ease-in-out_infinite]"
              : "bg-brand-blue/5",
          ].join(" ")}
        />
        {/* Inner gradient halo */}
        <div
          className={[
            "absolute inset-2 rounded-full bg-gradient-to-br",
            speaking
              ? "from-blue-200 via-orange-100 to-orange-200"
              : "from-blue-100 to-orange-100",
          ].join(" ")}
        />
        {/* Teacher portrait — bobs subtly to feel alive */}
        <img
          src={portraitSrc}
          alt="AI Teacher"
          onError={handleError}
          className={[
            "relative w-[92%] h-[92%] rounded-full object-cover drop-shadow-xl ring-4 ring-white bg-white",
            speaking
              ? "animate-[avatar-bob-fast_0.9s_ease-in-out_infinite]"
              : "animate-[avatar-bob_4s_ease-in-out_infinite]",
          ].join(" ")}
          draggable={false}
        />
        {/* Speaking pill — bottom of the avatar circle */}
        <div
          className={[
            "absolute -bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-lg whitespace-nowrap z-10",
            speaking
              ? "bg-emerald-500 text-white"
              : "bg-white text-ink-700 border border-ink-100",
          ].join(" ")}
        >
          <span
            className={[
              "w-2 h-2 rounded-full",
              speaking ? "bg-white animate-ping" : "bg-ink-300",
            ].join(" ")}
          />
          {speaking ? "Speaking" : "Ready"}
        </div>
      </div>

      {/* Audio wave bars */}
      <WaveBars active={speaking} />

      {/* Name plate — TV-presenter style chyron */}
      {showNamePlate && (
        <div className="mt-1 bg-gradient-to-r from-brand-blue to-brand-blue-light text-white rounded-lg shadow-card px-4 py-2 text-center min-w-[12rem]">
          <div className="text-sm font-bold">{presenterName}</div>
          <div className="text-[10px] text-white/80 uppercase tracking-wide">
            PassPoint AI · Built for Africa
          </div>
        </div>
      )}

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
