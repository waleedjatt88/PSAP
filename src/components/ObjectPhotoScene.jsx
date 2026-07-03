// ObjectPhotoScene — composed real-photo scene for "kg-object" visuals
// (Object Recognition + My Body), matching the alphabet/number/shape
// lesson stage design:
//   • a full-bleed real stock photo of the object (Pexels, fetched at
//     runtime via useWordPhoto),
//   • the pointing teacher avatar composited on top (white background
//     removed at runtime via chroma-key),
//   • a floating "Hello little stars!" speech bubble, and
//   • a glowing object name pill next to the photo.
//
// The surrounding stage chrome (header capsules, caption bar, nav arrows)
// is provided by KindergartenSlide — this component only fills the stage.

import useWordPhoto from "../hooks/useWordPhoto.js";
import useChromaKey from "../hooks/useChromaKey.js";
import { TEACHER_POINTED } from "../data/lessons/alphabetAssets.js";

export default function ObjectPhotoScene({ name, emoji, photoHint }) {
  const { photo, status } = useWordPhoto(name, photoHint);
  const avatar = useChromaKey(TEACHER_POINTED);

  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Full-bleed real photo (emoji fallback while loading / on failure) */}
      {status === "loading" ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-indigo-900 to-purple-900">
          <div className="text-8xl sm:text-9xl animate-bounce">{emoji || "🖼️"}</div>
          <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-white/70 px-3 text-center">
            Loading a real {(name || "").toLowerCase()}…
          </div>
          <div className="w-28 h-1.5 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-brand-blue animate-pulse" />
          </div>
        </div>
      ) : photo ? (
        <img
          key={photo.url}
          src={photo.url}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover select-none animate-[fadeIn_0.35s_ease-out]"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900">
          <span className="text-[12rem] leading-none">{emoji || "🌟"}</span>
        </div>
      )}

      {/* Soft vignette so the floating chrome stays readable */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/35 pointer-events-none" />

      {/* Pexels credit */}
      {status !== "loading" && photo?.credit?.name && (
        <a
          href={photo.credit.url || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute top-3 right-3 text-[9px] sm:text-[10px] text-white/95 bg-ink-900/45 backdrop-blur px-2 py-0.5 rounded hover:bg-ink-900/70 transition-colors z-10"
        >
          {photo.credit.name} · pexels
        </a>
      )}

      {/* Pointing teacher avatar — points toward the photo */}
      <img
        src={avatar}
        alt="Aunty Adesua"
        className="absolute bottom-0 left-0 h-[78%] w-auto max-w-[38%] object-contain object-bottom origin-bottom animate-[teacher-idle_4s_ease-in-out_infinite] drop-shadow-[0_15px_35px_rgba(0,0,0,0.55)] pointer-events-none select-none"
        draggable={false}
        referrerPolicy="no-referrer"
      />

      {/* Speech bubble — top-left, above the teacher */}
      <div className="absolute top-[4%] left-3 sm:left-5 max-w-[150px] sm:max-w-[190px] bg-white text-[#2c2264] rounded-[20px] shadow-[0_12px_35px_-8px_rgba(0,0,0,0.5)] px-3.5 py-2.5 border border-white/40 z-10 animate-[float_6s_ease-in-out_infinite]">
        <h4 className="text-[#1e154b] font-black text-[11px] sm:text-[12px] leading-tight">
          Hello little stars! ⭐
        </h4>
        <p className="text-[#322869] font-bold text-[10.5px] sm:text-[11.5px] leading-snug mt-1">
          Look carefully! <br />
          Can you name this{" "}
          <span className="text-red-500 font-extrabold text-[13px]">
            {emoji}
          </span>
          ?
        </p>
        <div className="mt-1.5 flex items-center gap-1.5 pt-1 border-t border-purple-100">
          <span className="flex items-center gap-0.5">
            <span className="w-[2px] h-1.5 bg-[#7c3aed] rounded-full animate-bounce" />
            <span className="w-[2px] h-3 bg-[#ec4899] rounded-full animate-bounce [animation-delay:0.15s]" />
            <span className="w-[2px] h-1 bg-[#38bdf8] rounded-full animate-bounce [animation-delay:0.3s]" />
          </span>
          <span className="text-[9px] font-black text-[#7c3aed] uppercase tracking-wider">
            Aunty Adesua
          </span>
        </div>
        {/* Tail pointing down toward the teacher below */}
        <div className="absolute left-8 bottom-[-8px] w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white" />
      </div>

      {/* Glowing object name pill */}
      <div className="absolute bottom-[42%] right-[9%] sm:right-[12%] z-10">
        <div className="bg-[#241e4c]/95 border-2 border-white/40 backdrop-blur-md text-white font-extrabold text-xs sm:text-sm px-5 sm:px-6 py-2 sm:py-2.5 rounded-full shadow-[0_12px_30px_rgba(0,0,0,0.6)] flex items-center gap-2">
          <span>{name}</span>
          <span className="text-base leading-none">{emoji}</span>
        </div>
      </div>
    </div>
  );
}
