import { useEffect, useRef, useState } from "react";
import mascotImg from "../assets/AI_Lesson.png";

// Realistic AI teacher avatar with an in-app photo picker.
//
// Image-resolution chain (first match wins):
//   1. User-uploaded photo from localStorage (set via the picker below).
//   2. Local files in /public — /teacher-avatar.jpg/.jpeg/.png/.webp.
//   3. Hosted Unsplash CDN portraits (real, free-to-use photos).
//   4. DiceBear illustrated portrait — works without network.
//   5. Bundled robot mascot — final safety net.
//
// Clicking the "Change photo" pill under the avatar opens a file picker.
// The selected image is read as a base64 data URL and stored in
// localStorage so it persists across reloads.

const LS_KEY = "pp_teacher_avatar";

const TEACHER_PATHS = [
  "/teacher-avatar.jpg",
  "/teacher-avatar.jpeg",
  "/teacher-avatar.png",
  "/teacher-avatar.webp",
  "https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=400&h=400&fit=crop&crop=faces&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=faces&q=80",
];

const DICEBEAR_URL = (seed) =>
  `https://api.dicebear.com/9.x/personas/svg?seed=${encodeURIComponent(
    seed,
  )}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=320`;

const DEFAULT_SEED = "Mr+Adebayo+Teacher";

function readStoredAvatar() {
  try {
    return localStorage.getItem(LS_KEY) || null;
  } catch {
    return null;
  }
}

export default function TalkingAvatar({
  speaking = false,
  size = "lg",
  caption,
  presenterName = "AI Teacher",
  teacherSeed = DEFAULT_SEED,
  showNamePlate = false,
  allowChange = false,
}) {
  // User-uploaded image (data URL) from localStorage. Takes precedence.
  const [userImg, setUserImg] = useState(() => readStoredAvatar());
  const [srcIdx, setSrcIdx] = useState(0);
  const [usingDicebear, setUsingDicebear] = useState(false);
  const [usingMascot, setUsingMascot] = useState(false);
  const fileInputRef = useRef(null);

  // Keep userImg synced if another component changes it (rare).
  useEffect(() => {
    function onStorage(e) {
      if (e.key === LS_KEY) setUserImg(e.newValue);
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  function handleError() {
    if (userImg) {
      // User upload failed to render — likely corrupted; clear it.
      try {
        localStorage.removeItem(LS_KEY);
      } catch {
        /* ignore */
      }
      setUserImg(null);
      return;
    }
    if (srcIdx < TEACHER_PATHS.length - 1) {
      setSrcIdx(srcIdx + 1);
    } else if (!usingDicebear) {
      setUsingDicebear(true);
    } else if (!usingMascot) {
      setUsingMascot(true);
    }
  }

  function pickFile() {
    fileInputRef.current?.click();
  }

  function onFileChosen(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = String(ev.target?.result || "");
      try {
        localStorage.setItem(LS_KEY, dataUrl);
      } catch {
        /* localStorage might be full — silently ignore */
      }
      setUserImg(dataUrl);
      // Reset error counters in case we'd already fallen through
      setSrcIdx(0);
      setUsingDicebear(false);
      setUsingMascot(false);
    };
    reader.readAsDataURL(file);
    // Reset input so picking the same file again still triggers change.
    e.target.value = "";
  }

  function clearPhoto() {
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
    setUserImg(null);
    setSrcIdx(0);
    setUsingDicebear(false);
    setUsingMascot(false);
  }

  const portraitSrc = userImg
    ? userImg
    : usingMascot
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

      {/* Change-photo control. Only shown where it makes sense (presenter
          column), keeps the avatar usable as a read-only thumbnail elsewhere. */}
      {allowChange && (
        <div className="mt-1 flex items-center gap-2 text-[11px]">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChosen}
            className="hidden"
          />
          <button
            onClick={pickFile}
            className="bg-ink-100 hover:bg-brand-blue hover:text-white text-ink-700 rounded-full px-3 py-1 font-semibold transition-colors"
            title="Upload a photo from your device"
          >
            📷 Change photo
          </button>
          {userImg && (
            <button
              onClick={clearPhoto}
              className="text-ink-500 hover:text-ink-900 underline"
              title="Use the default photo"
            >
              reset
            </button>
          )}
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
