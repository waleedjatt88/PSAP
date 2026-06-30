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
  const [photoUrl, setPhotoUrl] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [credit, setCredit] = useState(null);
  const [source, setSource] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [mode, setMode] = useState("photo");
  const [bumpKey, setBumpKey] = useState(0);
  // "Show more" gallery — fetched on demand. Stays within scope (same word).
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [gallery, setGallery] = useState(null); // null | "loading" | Photo[]
  const videoRef = useRef(null);
  const requestedKey = useRef(null);

  useEffect(() => {
    const key = `${word}::${photoHint || ""}::${videoHint || ""}`;
    if (requestedKey.current === key) return;
    requestedKey.current = key;
    setStatus("loading");
    setPhotoUrl(null);
    setVideoUrl(null);
    setCredit(null);
    setSource(null);
    setMode("photo");

    const photoBody = JSON.stringify({ word, hint: photoHint });
    const videoBody = JSON.stringify({ word, hint: videoHint || photoHint });

    const photoP = fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: photoBody,
    })
      .then((r) => r.json())
      .then((d) => (d?.url ? d : null))
      .catch(() => null);

    const videoP = fetch("/api/video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: videoBody,
    })
      .then((r) => r.json())
      .then((d) => (d?.url ? d : null))
      .catch(() => null);

    Promise.all([photoP, videoP]).then(([p, v]) => {
      if (requestedKey.current !== key) return;
      if (!p && !v) {
        setStatus("error");
        return;
      }
      if (p) {
        setPhotoUrl(p.url);
        setCredit(p.credit || null);
        setSource(p.source || null);
      }
      if (v) {
        setVideoUrl(v.url);
        // Auto-prefer video if we got one — the kid loves motion
        setMode("video");
      }
      setStatus("ready");
    });
  }, [word, photoHint, videoHint]);

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

  async function openGallery() {
    setGalleryOpen(true);
    if (Array.isArray(gallery) && gallery.length) return; // already loaded
    setGallery("loading");
    try {
      const r = await fetch("/api/images", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word, hint: photoHint, count: 8 }),
      });
      const data = await r.json();
      if (Array.isArray(data?.photos) && data.photos.length) {
        setGallery(data.photos);
      } else {
        setGallery([]);
      }
    } catch {
      setGallery([]);
    }
  }
  function closeGallery() {
    setGalleryOpen(false);
  }

  return (
    <div className="relative w-full h-full flex flex-col md:flex-row items-stretch justify-center gap-3 sm:gap-5 md:gap-6 px-3 sm:px-5 md:px-6 py-2 sm:py-3">
      <LetterCard letter={letter} word={word} bumpKey={bumpKey} />
      <MediaCard
        word={word}
        emoji={emoji}
        status={status}
        photoUrl={photoUrl}
        videoUrl={videoUrl}
        videoRef={videoRef}
        credit={credit}
        source={source}
        bumpKey={bumpKey}
        mode={mode}
        onSetMode={setMode}
        onTap={celebrate}
        onReplay={handleReplay}
        onShowMore={openGallery}
        onPhotoError={() => setPhotoUrl(null)}
        onVideoError={() => {
          setVideoUrl(null);
          setMode("photo");
        }}
      />

      {galleryOpen && (
        <GalleryOverlay
          word={word}
          photos={gallery}
          onClose={closeGallery}
        />
      )}
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

// ─── Right: media card with Photo ↔ Video toggle ─────────────────────
function MediaCard({
  word,
  emoji,
  status,
  photoUrl,
  videoUrl,
  videoRef,
  credit,
  source,
  bumpKey,
  mode,
  onSetMode,
  onTap,
  onReplay,
  onShowMore,
  onPhotoError,
  onVideoError,
}) {
  const showingVideo = mode === "video" && videoUrl;
  return (
    <div
      key={`m-${bumpKey}`}
      onClick={onTap}
      className="relative flex-1 min-h-0 rounded-3xl shadow-2xl overflow-hidden bg-white ring-4 ring-white cursor-pointer animate-[item-pop_0.55s_cubic-bezier(0.34,1.56,0.64,1)_both]"
    >
      {status === "loading" && <LoadingPanel word={word} emoji={emoji} />}

      {status !== "loading" && (
        <>
          {/* Photo — always rendered behind so it's painted instantly */}
          {photoUrl && (
            <img
              src={photoUrl}
              alt={`A ${word}`}
              className="absolute inset-0 w-full h-full object-cover"
              draggable={false}
              onError={onPhotoError}
            />
          )}
          {/* Video — only mounted (and overlaying photo) when the user
              has selected "video" mode. Mounting/unmounting (instead of
              hiding) ensures the video pauses and frees bandwidth when
              the kid is on photo mode. */}
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
          {!photoUrl && !videoUrl && (
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

          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onReplay();
              }}
              className="flex items-center gap-1.5 bg-white/95 backdrop-blur text-ink-900 font-bold rounded-full pl-1.5 pr-3 py-1.5 shadow-xl hover:bg-amber-50 active:scale-[0.97] transition text-xs sm:text-sm"
              title="Watch this again"
            >
              <span className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center text-base">
                ↻
              </span>
              <span className="hidden sm:inline">Watch again</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShowMore?.();
              }}
              className="flex items-center gap-1.5 bg-white/95 backdrop-blur text-ink-900 font-bold rounded-full pl-1.5 pr-3 py-1.5 shadow-xl hover:bg-blue-50 active:scale-[0.97] transition text-xs sm:text-sm"
              title={`See more photos of a ${word.toLowerCase()}`}
            >
              <span className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-base">
                🖼️
              </span>
              <span className="hidden sm:inline">More {word.toLowerCase()}s</span>
            </button>
          </div>

          {/* Photo ↔ Video toggle — bottom-left. Only shown when both
              are available, so it doesn't lie about modes you can't pick. */}
          {photoUrl && videoUrl && (
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
                📷 Photo
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

          {credit?.name && source && (
            <a
              href={credit.url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-2 right-2 text-[9px] sm:text-[10px] text-white/95 bg-ink-900/45 backdrop-blur px-2 py-0.5 rounded hover:bg-ink-900/70 transition-colors z-10"
              onClick={(e) => e.stopPropagation()}
            >
              {credit.name} · {source}
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

// ─── Show-more gallery overlay ───────────────────────────────────────
// Full-overlay grid of additional Pexels photos for the SAME word.
// Stays in scope by design — only photos of `word`, nothing else.
function GalleryOverlay({ word, photos, onClose }) {
  return (
    <div
      className="absolute inset-0 z-40 bg-ink-900/70 backdrop-blur-md rounded-3xl overflow-hidden animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
    >
      <div
        className="absolute inset-3 sm:inset-6 bg-white rounded-3xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{ fontFamily: "Fredoka, 'Baloo 2', system-ui, sans-serif" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-ink-100 bg-gradient-to-r from-blue-50 to-amber-50">
          <div>
            <div className="text-[10px] uppercase tracking-wider font-bold text-brand-blue">
              More photos
            </div>
            <div className="text-lg sm:text-xl font-extrabold text-ink-900">
              {word.toUpperCase()}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white shadow hover:bg-rose-50 text-ink-700 text-xl font-bold flex items-center justify-center"
            aria-label="Close gallery"
          >
            ✕
          </button>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {photos === "loading" && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-ink-500">
              <div className="text-3xl animate-bounce">🖼️</div>
              <div className="text-xs uppercase tracking-wide font-bold">
                Finding more {word.toLowerCase()} photos…
              </div>
            </div>
          )}
          {Array.isArray(photos) && photos.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-ink-500">
              <div className="text-3xl">🤔</div>
              <div className="text-sm">No more photos available right now.</div>
            </div>
          )}
          {Array.isArray(photos) && photos.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {photos.map((p, i) => (
                <a
                  key={p.url + i}
                  href={p.credit?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative aspect-square rounded-2xl overflow-hidden shadow ring-2 ring-white bg-ink-100 hover:scale-[1.02] active:scale-[0.98] transition-transform"
                >
                  <img
                    src={p.thumb || p.url}
                    alt={`${word} ${i + 1}`}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                  {p.credit?.name && (
                    <div className="absolute bottom-1 right-1 text-[8px] text-white/90 bg-ink-900/40 backdrop-blur px-1 py-0.5 rounded">
                      {p.credit.name}
                    </div>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="px-5 py-2 text-[10px] text-center text-ink-500 border-t border-ink-100">
          All photos from Pexels · stays on {word.toLowerCase()}
        </div>
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
