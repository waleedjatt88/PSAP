// PowerPoint-style slide. Renders one lesson section as a presentation
// slide — large heading, sentences as a flowing paragraph with the
// currently-spoken sentence visibly highlighted (teleprompter style).
//
// Props:
//   section: { id, heading, sentences[] }
//   sectionStartIdx: index in the flat sentence list where this section begins
//   currentIdx: global current sentence index across the whole lesson
//   slideNumber, totalSlides
//   subject, topic — shown in the slide footer
//   isActive: whether this is the visible slide (controls animation key)
//   onSentenceClick: (globalIdx) => void
export default function LessonSlide({
  section,
  sectionStartIdx,
  currentIdx,
  slideNumber,
  totalSlides,
  subject,
  topic,
  isActive,
  onSentenceClick,
}) {
  if (!section) return null;

  return (
    <div
      key={section.id}
      className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col h-full slide-enter"
    >
      {/* Slide chrome — subject + slide number */}
      <div className="px-6 py-3 bg-gradient-to-r from-brand-blue to-brand-blue-light text-white flex items-center justify-between text-xs">
        <div className="font-semibold tracking-wide uppercase">
          {subject} · {topic}
        </div>
        <div className="font-mono tabular-nums">
          Slide {slideNumber} / {totalSlides}
        </div>
      </div>

      {/* Heading bar */}
      <div className="px-8 py-5 border-b border-ink-100">
        <h2 className="text-2xl md:text-3xl font-extrabold text-ink-900 leading-tight">
          {section.heading}
        </h2>
      </div>

      {/* Body — sentences with active one highlighted (teleprompter) */}
      <div className="flex-1 px-8 py-6 text-lg md:text-xl text-ink-700 leading-relaxed overflow-y-auto">
        <p>
          {section.sentences.map((text, i) => {
            const globalIdx = sectionStartIdx + i;
            const isCurrent = globalIdx === currentIdx;
            const isPast = currentIdx >= 0 && globalIdx < currentIdx;
            return (
              <span
                key={i}
                onClick={() => onSentenceClick?.(globalIdx)}
                className={[
                  "cursor-pointer transition-all duration-200 rounded px-1 -mx-1",
                  isCurrent
                    ? "bg-yellow-200 text-ink-900 ring-2 ring-yellow-400 shadow-sm font-medium"
                    : isPast
                      ? "text-ink-500"
                      : "hover:bg-ink-100",
                ].join(" ")}
                title="Click to start the lesson from here"
              >
                {text}{" "}
              </span>
            );
          })}
        </p>
      </div>
    </div>
  );
}
