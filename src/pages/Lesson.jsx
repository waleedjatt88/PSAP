import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../store/user";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MicIcon,
} from "../components/icons";
import AskAIModal from "../components/AskAIModal";
import TalkingAvatar from "../components/TalkingAvatar";
import LessonSlide from "../components/LessonSlide";
import useTeleprompter from "../hooks/useTeleprompter";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { findSubject, findTopic } from "../data/curriculum";
import { getLesson, flattenLesson } from "../data/lessons/index.js";

export default function Lesson() {
  const { user } = useUser();
  const [search] = useSearchParams();
  const navigate = useNavigate();

  const subjectId = search.get("subject") || "mathematics";
  const topicTitle = search.get("topic") || "Fractions";
  const subject = useMemo(() => findSubject(subjectId), [subjectId]);
  const topic = useMemo(
    () => findTopic(subjectId, topicTitle),
    [subjectId, topicTitle],
  );
  const lesson = useMemo(() => getLesson(topic.lessonId), [topic]);

  const flat = useMemo(() => flattenLesson(lesson), [lesson]);
  const sentences = useMemo(() => flat.map((f) => f.text), [flat]);
  const tele = useTeleprompter(sentences);

  // Section starts — useful for slide navigation + auto-advance.
  const sections = lesson?.sections || [];
  const sectionStarts = useMemo(() => {
    const map = {};
    sections.forEach((s) => {
      map[s.id] = flat.findIndex((f) => f.sectionId === s.id);
    });
    return map;
  }, [sections, flat]);

  // Active slide is driven by:
  //  - the section of the sentence currently being spoken (auto-advance)
  //  - manual prev/next clicks (user override until next sentence triggers)
  const [manualSlide, setManualSlide] = useState(null);
  const currentSection = useMemo(() => {
    if (tele.currentIdx < 0 || tele.currentIdx >= flat.length) return null;
    return flat[tele.currentIdx].sectionId;
  }, [tele.currentIdx, flat]);

  // Auto-advance: when the AI moves into a new section, drop any manual override
  useEffect(() => {
    if (currentSection) setManualSlide(null);
  }, [currentSection]);

  // Which slide is showing?
  const activeSectionId =
    manualSlide || currentSection || sections[0]?.id;
  const activeSlideIdx = sections.findIndex((s) => s.id === activeSectionId);
  const activeSection = sections[activeSlideIdx] || sections[0];

  const [askOpen, setAskOpen] = useState(false);

  // Voice commands on the lesson page (pause / resume / ask).
  const voiceCmd = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onCommand: (lower) => {
      if (!lower) return;
      const tail = lower.slice(-40);
      if (
        /\b(i have a question|ask (a |the )?question|wait,? question)\b/.test(
          tail,
        )
      ) {
        if (tele.state === "playing") tele.pause();
        setAskOpen(true);
      } else if (/\b(pause|stop|wait|hold on)\b/.test(tail)) {
        if (tele.state === "playing") tele.pause();
      } else if (
        /\b(continue|resume|go on|carry on|keep going|play)\b/.test(tail)
      ) {
        if (tele.state === "paused" || tele.state === "idle") tele.play();
      }
    },
  });

  // Stop speech + close modal when the lesson changes
  useEffect(() => {
    tele.stop();
    setAskOpen(false);
    setManualSlide(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  function openAskAI() {
    if (tele.state === "playing") tele.pause();
    setAskOpen(true);
  }
  function closeAskAI() {
    setAskOpen(false);
    if (tele.currentIdx >= 0 && tele.state === "paused") {
      setTimeout(() => tele.play(), 250);
    }
  }

  // What was being read when the student interrupted?
  const resumeCtx = useMemo(() => {
    if (tele.currentIdx < 0 || tele.currentIdx >= flat.length) return null;
    const f = flat[tele.currentIdx];
    return { sectionHeading: f.sectionHeading, sentence: f.text };
  }, [tele.currentIdx, flat]);

  if (!lesson) {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
        Lesson not found.{" "}
        <Link to="/subjects" className="font-semibold underline">
          Back to subjects
        </Link>
      </div>
    );
  }

  // Jump to a slide manually — does NOT change what's being spoken (the
  // student can preview a future slide without interrupting the lesson).
  function goToSlide(idx) {
    const target = sections[idx];
    if (target) setManualSlide(target.id);
  }
  function startSlide() {
    // Speak this slide from its first sentence.
    const startIdx = sectionStarts[activeSection.id];
    if (startIdx >= 0) tele.jumpTo(startIdx);
  }

  const progressPct = flat.length
    ? Math.round(((Math.max(tele.currentIdx, 0) + 1) / flat.length) * 100)
    : 0;
  const isSpeaking = tele.state === "playing";

  return (
    <div className="space-y-4 pb-28">
      {/* Header / breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 text-sm text-ink-700">
          <Link
            to="/subjects"
            className="flex items-center gap-2 hover:text-ink-900"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            <span>{subject.name}</span>
          </Link>
          <span className="text-ink-300">/</span>
          <span className="font-semibold text-ink-900">{topic.title}</span>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-500">Progress</span>
          <div className="h-2 w-40 rounded-full bg-ink-100 overflow-hidden">
            <div
              className="h-full bg-brand-blue transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-semibold tabular-nums w-10 text-right">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Classroom layout: avatar (left) + presentation slide (right) */}
      <div className="grid lg:grid-cols-[18rem_minmax(0,1fr)] gap-4">
        {/* Avatar column */}
        <aside className="bg-white rounded-2xl shadow-card p-6 flex flex-col items-center text-center lg:sticky lg:top-20 lg:self-start">
          <div className="inline-flex items-center gap-2 text-[10px] font-semibold text-brand-blue bg-blue-50 rounded-full px-2 py-1 mb-3">
            ✨ PASSPOINT AI · BUILT FOR AFRICA
          </div>
          <TalkingAvatar
            speaking={isSpeaking}
            size="lg"
            caption={
              isSpeaking
                ? `Sentence ${tele.currentIdx + 1} of ${flat.length}`
                : tele.state === "paused"
                  ? `Paused on sentence ${tele.currentIdx + 1}`
                  : "Press play to start the lesson"
            }
          />

          {/* Primary controls inside the avatar column */}
          <div className="mt-5 w-full space-y-2">
            <button
              onClick={isSpeaking ? tele.pause : tele.play}
              disabled={!tele.supported}
              className="w-full bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold py-2.5 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSpeaking
                ? "⏸  Pause"
                : tele.state === "paused"
                  ? "▶  Resume"
                  : "▶  Start lesson"}
            </button>
            <button
              onClick={openAskAI}
              className="w-full bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-semibold py-2.5 rounded-full flex items-center justify-center gap-2"
            >
              <MicIcon className="w-4 h-4" /> Ask a Question
            </button>
            {/* Voice command toggle */}
            {voiceCmd.supported && (
              <button
                onClick={() =>
                  voiceCmd.listening ? voiceCmd.stop() : voiceCmd.start()
                }
                className={[
                  "w-full text-xs font-medium py-2 rounded-full transition-colors flex items-center justify-center gap-2",
                  voiceCmd.listening
                    ? "bg-red-500 text-white animate-pulse"
                    : "bg-ink-100 text-ink-700 hover:bg-ink-300",
                ].join(" ")}
              >
                🎙{" "}
                {voiceCmd.listening
                  ? "Listening… say \"pause\", \"continue\""
                  : "Enable voice commands"}
              </button>
            )}
          </div>

          {/* Speed control */}
          {tele.supported && (
            <div className="mt-4 flex items-center gap-1 text-[10px] text-ink-500">
              <span>Speed</span>
              {[0.85, 1, 1.25].map((r) => (
                <button
                  key={r}
                  onClick={() => tele.setRate(r)}
                  className={`px-1.5 py-0.5 rounded ${
                    tele.rate === r
                      ? "bg-brand-blue text-white"
                      : "bg-ink-100 text-ink-700 hover:bg-ink-300"
                  }`}
                >
                  {r}×
                </button>
              ))}
            </div>
          )}

          {/* Voice command live transcript */}
          {voiceCmd.listening && voiceCmd.transcript && (
            <div className="mt-3 w-full bg-ink-900/90 text-white text-[11px] rounded-lg px-2 py-1.5 text-center">
              🎙 "{voiceCmd.transcript}"
            </div>
          )}
        </aside>

        {/* Slide column */}
        <div className="flex flex-col h-[min(70vh,38rem)]">
          <LessonSlide
            section={activeSection}
            sectionStartIdx={sectionStarts[activeSection?.id] ?? 0}
            currentIdx={tele.currentIdx}
            slideNumber={activeSlideIdx + 1}
            totalSlides={sections.length}
            subject={subject.name}
            topic={topic.title}
            isActive
            onSentenceClick={(globalIdx) => tele.jumpTo(globalIdx)}
          />

          {/* Slide navigation */}
          <div className="bg-white rounded-2xl shadow-card mt-3 p-2 flex items-center justify-between gap-2">
            <button
              onClick={() => goToSlide(activeSlideIdx - 1)}
              disabled={activeSlideIdx <= 0}
              className="flex items-center gap-1 text-xs font-medium text-ink-700 hover:text-ink-900 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Prev slide
            </button>

            {/* Slide dots */}
            <div className="flex-1 flex justify-center items-center gap-1.5">
              {sections.map((s, i) => (
                <button
                  key={s.id}
                  onClick={() => goToSlide(i)}
                  title={s.heading}
                  className={[
                    "h-2 rounded-full transition-all",
                    i === activeSlideIdx
                      ? "w-8 bg-brand-blue"
                      : "w-2 bg-ink-300 hover:bg-ink-500",
                  ].join(" ")}
                />
              ))}
            </div>

            <div className="flex items-center gap-2">
              {/* If the active slide isn't the one being spoken, offer a
                  "speak this slide" jump button */}
              {activeSection?.id !== currentSection && (
                <button
                  onClick={startSlide}
                  className="text-[10px] bg-brand-blue text-white px-2 py-1 rounded-full"
                  title="Have the AI read this slide"
                >
                  ▶ Read this
                </button>
              )}
              <button
                onClick={() => goToSlide(activeSlideIdx + 1)}
                disabled={activeSlideIdx >= sections.length - 1}
                className="flex items-center gap-1 text-xs font-medium text-ink-700 hover:text-ink-900 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2"
              >
                Next slide <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Objectives bar */}
      {lesson.objectives?.length > 0 && (
        <div className="bg-white rounded-2xl shadow-card p-4">
          <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-2">
            What you'll learn
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5">
            {lesson.objectives.map((o) => (
              <div
                key={o}
                className="text-xs text-ink-700 flex items-start gap-1.5"
              >
                <span className="text-emerald-500 mt-0.5">✓</span>
                <span>{o}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="bg-white rounded-2xl shadow-card p-3 flex items-center justify-between gap-2">
        <Link
          to="/subjects"
          className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2"
        >
          <ArrowLeftIcon className="w-4 h-4" /> All lessons
        </Link>
        <button
          onClick={() =>
            navigate(`/lesson?subject=${subject.id}&topic=${topic.title}`)
          }
          className="text-xs text-ink-500 hover:underline"
        >
          Restart from beginning
        </button>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2"
        >
          Dashboard <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Ask AI overlay */}
      <AskAIModal
        open={askOpen}
        lesson={lesson}
        resumeContext={resumeCtx}
        classLevel={user?.classLevel || lesson.classLevel}
        onClose={closeAskAI}
      />
    </div>
  );
}
