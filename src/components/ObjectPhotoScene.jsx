// ObjectPhotoScene — real-photo card for "kg-object" visuals (Object
// Recognition + My Body), mirroring how LetterPhotoScene shows a real
// stock photo instead of a plain emoji for the alphabet lesson. There's
// no letter to teach here, so this is just the media card: one big real
// photo, a name label, and an emoji fallback while loading/on failure.

import useWordPhoto from "../hooks/useWordPhoto.js";

export default function ObjectPhotoScene({ name, emoji, photoHint }) {
  const { photo, status } = useWordPhoto(name, photoHint);

  return (
    <div className="relative w-full h-full flex items-center justify-center px-4 sm:px-8 py-2 sm:py-3">
      <div className="relative w-full h-full max-w-4xl rounded-[28px] shadow-2xl overflow-hidden bg-white ring-4 ring-white/70 animate-[item-pop_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]">
        {status === "loading" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink-100 to-white">
            <div className="text-8xl sm:text-9xl animate-bounce">{emoji || "🖼️"}</div>
            <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-ink-500 px-3 text-center">
              Loading a real {(name || "").toLowerCase()}…
            </div>
            <div className="w-28 h-1.5 rounded-full bg-ink-300/50 overflow-hidden">
              <div className="h-full w-1/3 rounded-full bg-brand-blue animate-pulse" />
            </div>
          </div>
        )}

        {status !== "loading" && (
          <>
            {photo ? (
              <img
                key={photo.url}
                src={photo.url}
                alt={name}
                className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.35s_ease-out]"
                draggable={false}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white to-ink-100">
                <div className="text-[12rem] leading-none">{emoji}</div>
              </div>
            )}

            {photo?.credit?.name && (
              <a
                href={photo.credit.url || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="absolute top-3 right-3 text-[9px] sm:text-[10px] text-white/95 bg-ink-900/45 backdrop-blur px-2 py-0.5 rounded hover:bg-ink-900/70 transition-colors z-10"
              >
                {photo.credit.name} · pexels
              </a>
            )}
          </>
        )}

        {/* Name label */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/95 border border-white rounded-full px-6 py-2.5 shadow-xl">
          <span
            className="font-extrabold text-brand-blue uppercase tracking-wider text-2xl sm:text-4xl whitespace-nowrap"
            style={{
              fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif",
              WebkitTextStroke: "1px rgba(255,255,255,0.5)",
            }}
          >
            {name}
          </span>
        </div>
      </div>
    </div>
  );
}
