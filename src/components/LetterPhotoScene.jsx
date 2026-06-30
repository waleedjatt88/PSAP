// LetterPhotoScene — kindergarten alphabet "flashcard duo" layout.
//
// Two equal-weight cards side-by-side (stacked on mobile):
//   • LEFT  — a bold pastel "letter card" with the uppercase letter
//             huge, the lowercase letter underneath, a friendly
//             divider, and the word in big chunky caps. No media,
//             just typography that reads from across the room.
//   • RIGHT — a white "media card" with the real Pexels video
//             autoplaying muted+looped on top of a Pexels photo. The
//             HUD (live badge, watch-again, photo credit) lives ONLY
//             inside this card so nothing covers the letter.
//
// Why this layout: kids and teachers respond best to "one thing to look
// at, one thing to read." Full-bleed photo + overlay text was too busy
// (background animals fought for attention with the letter). The two-
// card split is a flashcard the brain already knows.
//
// The kid talks to the AI directly via continuous listening wired in
// pages/Lesson.jsx — there is no "Talk to me" button anywhere here.

import { useEffect, useRef, useState } from "react";

export default function LetterPhotoScene({
  letter,
  word,
  emoji,
  photoHint,
  videoHint, // NEW — separate Pexels query for videos (different index)
  onReplay,
}) {
  // We fetch a SET of real photos for the same word and auto-rotate
  // them so the child sees several real apples / cats / kites without
  // having to tap anything. The strict "word stays the same" rule keeps
  // the scene in-scope by design.
  const [photoSet, setPhotoSet] = useState([]); // [{url, thumb, credit}]
  const [photoIdx, setPhotoIdx] = useState(0);
  const [videoUrl, setVideoUrl] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [mode, setMode] = useState("photo");
  const [bumpKey, setBumpKey] = useState(0);
  const videoRef = useRef(null);
  const requestedKey = useRef(null);

  const currentPhoto = photoSet[photoIdx] || null;

  useEffect(() => {
    const key = `${word}::${photoHint || ""}::${videoHint || ""}`;
    if (requestedKey.current === key) return;
    requestedKey.current = key;
    setStatus("loading");
    setPhotoSet([]);
    setPhotoIdx(0);
    setVideoUrl(null);
    setMode("photo");

    const photoBody = JSON.stringify({ word, hint: photoHint, count: 6 });
    const videoBody = JSON.stringify({ word, hint: videoHint || photoHint });

    // /api/images returns up to N photos for the same word so the scene
    // can auto-rotate without leaving scope.
    const photosP = fetch("/api/images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: photoBody,
    })
      .then((r) => r.json())
      .then((d) => (Array.isArray(d?.photos) ? d.photos : []))
      .catch(() => []);

    const videoP = fetch("/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: videoBody,
    })
      .then((r) => r.json())
      .then((d) => (d?.url ? d : null))
      .catch(() => null);

    Promise.all([photosP, videoP]).then(([ps, v]) => {
      if (requestedKey.current !== key) return;
      if (!ps.length && !v) {
        setStatus("error");
        return;
      }
      if (ps.length) setPhotoSet(ps);
      if (v) {
        setVideoUrl(v.url);
        // Auto-prefer video if we got one — kids love motion
        setMode("video");
      }
      setStatus("ready");
    });
  }, [word, photoHint, videoHint]);

  // Auto-rotate through the photo set so the child sees several real
  // photos passively. Rotation pauses while in video mode (video is
  // looping on its own) and while loading.
  useEffect(() => {
    if (mode === "video") return;
    if (photoSet.length < 2) return;
    const id = setInterval(() => {
      setPhotoIdx((i) => (i + 1) % photoSet.length);
    }, 3500);
    return () => clearInterval(id);
  }, [mode, photoSet.length]);

  // Replay = restart the video AND retrigger the card entrance
  useEffect(() => {
    if (!videoRef.current) return;
    try {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    } catch {
      /* ignored */
    }
  }, [bumpKey, videoUrl]);

  function celebrate() {
    setBumpKey((k) => k + 1);
  }
  function handleReplay() {
    celebrate();
    onReplay?.();
  }

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-stretch justify-center gap-3 sm:gap-5 md:gap-6 px-3 sm:px-5 md:px-6 py-2 sm:py-3">
      <LetterCard letter={letter} word={word} bumpKey={bumpKey} />
      <MediaCard
        word={word}
        emoji={emoji}
        status={status}
        photoSet={photoSet}
        photoIdx={photoIdx}
        currentPhoto={currentPhoto}
        videoUrl={videoUrl}
        videoRef={videoRef}
        bumpKey={bumpKey}
        mode={mode}
        onSetMode={setMode}
        onTap={celebrate}
        onReplay={handleReplay}
        onPickPhoto={(i) => setPhotoIdx(i)}
        onPhotoError={() => {
          // Skip this photo — advance to the next in the set
          setPhotoSet((set) => set.filter((_, i) => i !== photoIdx));
          setPhotoIdx((i) => Math.max(0, i - 1));
        }}
        onVideoError={() => {
          setVideoUrl(null);
          setMode("photo");
        }}
      />
    </div>
  );
}

// ─── Left: letter card ───────────────────────────────────────────────
// Sizes are viewport-clamped so long words ("XYLOPHONE", "UMBRELLA",
// "RABBIT") never overflow the card and clip at the bottom. The big
// letter scales with the slide height instead of the breakpoint, so it
// always plays nicely on tablets, classroom monitors, and phones.
function LetterCard({ letter, word, bumpKey }) {
  // Auto-shrink the word as it gets longer. "Apple"/"Dog" stay big;
  // "Xylophone"/"Ice cream" drop a size so they fit on a single line.
  const wordSize =
    word.length >= 9
      ? "clamp(1rem, 3.4vh, 2rem)"
      : word.length >= 6
        ? "clamp(1.25rem, 4vh, 2.4rem)"
        : "clamp(1.5rem, 4.8vh, 3rem)";

  return (
    <div
      key={`l-${bumpKey}`}
      className="relative flex-1 min-h-0 rounded-3xl shadow-2xl overflow-hidden bg-gradient-to-br from-white via-amber-50 to-rose-50 border-4 border-white animate-[item-pop_0.5s_cubic-bezier(0.34,1.56,0.64,1)_both]"
      style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
    >
      <DotPattern />

      <div className="relative z-10 h-full flex flex-col items-center justify-center text-center px-3 py-3 gap-1 sm:gap-2">
        <div
          className="font-extrabold text-ink-900 leading-[0.85] select-none animate-[bounce-soft_2.6s_ease-in-out_infinite]"
          style={{
            WebkitTextStroke: "4px rgba(255,255,255,0.55)",
            fontSize: "clamp(5rem, 26vh, 14rem)",
          }}
        >
          {letter}
        </div>
        <div
          className="font-extrabold text-ink-700/65 leading-none select-none"
          style={{ fontSize: "clamp(1.5rem, 7vh, 4rem)" }}
        >
          {letter.toLowerCase()}
        </div>

        {/* Friendly divider — a row of 3 dots */}
        <div className="flex items-center gap-2 my-1 sm:my-2">
          <span className="w-2 h-2 rounded-full bg-brand-orange" />
          <span className="w-2 h-2 rounded-full bg-brand-blue" />
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
        </div>

        <div
          className="font-extrabold text-brand-blue uppercase tracking-wider whitespace-nowrap"
          style={{
            WebkitTextStroke: "1px rgba(255,255,255,0.5)",
            fontSize: wordSize,
          }}
        >
          {word}
        </div>
      </div>
    </div>
  );
}

// ─── Right: media card — auto-rotating photo carousel + optional video ─
function MediaCard({
  word,
  emoji,
  status,
  photoSet,
  photoIdx,
  currentPhoto,
  videoUrl,
  videoRef,
  bumpKey,
  mode,
  onSetMode,
  onTap,
  onReplay,
  onPickPhoto,
  onPhotoError,
  onVideoError,
}) {
  const showingVideo = mode === "video" && videoUrl;
  const credit = currentPhoto?.credit;

  return (
    <div
      key={`m-${bumpKey}`}
      onClick={onTap}
      className="relative flex-1 min-h-0 rounded-3xl shadow-2xl overflow-hidden bg-white ring-4 ring-white cursor-pointer animate-[item-pop_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]"
    >
      {status === "loading" && <LoadingPanel word={word} emoji={emoji} />}

      {status !== "loading" && (
        <>
          {/* Current photo — cross-fades when photoIdx changes thanks
              to the keyed image (React re-mounts → CSS fade-in). */}
          {currentPhoto && (
            <img
              key={`p-${photoIdx}-${currentPhoto.url}`}
              src={currentPhoto.url}
              alt={`A ${word}`}
              className="absolute inset-0 w-full h-full object-cover animate-[fadeIn_0.35s_ease-out]"
              draggable={false}
              onError={onPhotoError}
            />
          )}
          {/* Video — overlays photo when in video mode */}
          {showingVideo && (
            <video
              ref={videoRef}
              src={videoUrl}
              className="absolute inset-0 w-full h-full object-cover"
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={onVideoError}
            />
          )}
          {!currentPhoto && !videoUrl && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-white to-ink-100">
              <div className="text-[10rem] leading-none">{emoji}</div>
            </div>
          )}

          {showingVideo && (
            <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full shadow flex items-center gap-1.5 z-10">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </div>
          )}

          {/* Watch again — top-right, single button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReplay();
            }}
            className="absolute top-3 right-3 flex items-center gap-1.5 bg-white/95 backdrop-blur text-ink-900 font-bold rounded-full pl-1.5 pr-3 py-1.5 shadow-xl hover:bg-amber-50 active:scale-[0.97] transition text-xs sm:text-sm z-10"
            title="Watch this again"
          >
            <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-base">
              ↻
            </span>
            <span className="hidden sm:inline">Watch again</span>
          </button>

          {/* Photo ↔ Video toggle — bottom-left, only when both exist */}
          {photoSet.length > 0 && videoUrl && (
            <div
              className="absolute bottom-2 left-2 flex bg-white/95 backdrop-blur rounded-full p-0.5 shadow-xl z-10"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => onSetMode("photo")}
                className={[
                  "px-3 py-1 rounded-full text-[11px] font-bold transition-colors",
                  mode === "photo"
                    ? "bg-brand-blue text-white"
                    : "text-ink-700 hover:text-ink-900",
                ].join(" ")}
              >
                📷 Photos
              </button>
              <button
                onClick={() => onSetMode("video")}
                className={[
                  "px-3 py-1 rounded-full text-[11px] font-bold transition-colors",
                  mode === "video"
                    ? "bg-brand-blue text-white"
                    : "text-ink-700 hover:text-ink-900",
                ].join(" ")}
              >
                🎥 Video
              </button>
            </div>
          )}

          {/* Auto-rotation pagination dots — only when there are multiple
              photos and we're in photo mode. Tappable to jump directly. */}
          {!showingVideo && photoSet.length > 1 && (
            <div
              className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-ink-900/40 backdrop-blur px-2.5 py-1 rounded-full shadow-lg z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {photoSet.map((_, i) => (
                <button
                  key={i}
                  onClick={() => onPickPhoto(i)}
                  className={[
                    "h-1.5 rounded-full transition-all",
                    i === photoIdx
                      ? "w-5 bg-white"
                      : "w-1.5 bg-white/55 hover:bg-white/80",
                  ].join(" ")}
                  aria-label={`Photo ${i + 1} of ${photoSet.length}`}
                />
              ))}
            </div>
          )}

          {!showingVideo && credit?.name && (
            <a
              href={credit.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 text-[9px] sm:text-[10px] text-white/95 bg-ink-900/45 backdrop-blur px-2 py-0.5 rounded hover:bg-ink-900/70 transition-colors z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {credit.name} · pexels
            </a>
          )}
        </>
      )}
    </div>
  );
}

function LoadingPanel({ word, emoji }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-ink-100 to-white">
      <div className="text-7xl sm:text-8xl animate-bounce">{emoji || "🎨"}</div>
      <div className="text-[10px] sm:text-xs font-bold uppercase tracking-wide text-ink-500 px-3 text-center">
        Loading a real {word.toLowerCase()}…
      </div>
      <div className="w-24 h-1.5 rounded-full bg-ink-300/50 overflow-hidden">
        <div className="h-full w-1/3 rounded-full bg-brand-blue animate-[shimmer-slide_1.4s_ease-in-out_infinite]" />
      </div>
    </div>
  );
}

// Confetti dots in the letter card background — cosmetic only.
function DotPattern() {
  return (
    <div
      className="absolute inset-0 opacity-30 pointer-events-none"
      style={{
        backgroundImage:
          "radial-gradient(circle at 1px 1px, rgba(15,23,42,0.25) 1px, transparent 0)",
        backgroundSize: "28px 28px",
      }}
    />
  );
}
