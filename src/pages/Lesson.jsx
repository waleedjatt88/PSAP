import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../store/user";
import { ArrowLeftIcon, ArrowRightIcon, MicIcon, CloseIcon } from "../components/icons";
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

  const sections = lesson?.sections || [];
  const sectionStarts = useMemo(() => {
    const map = {};
    sections.forEach((s) => {
      map[s.id] = flat.findIndex((f) => f.sectionId === s.id);
    });
    return map;
  }, [sections, flat]);

  // The slide shown can be either auto-driven (by which section the AI
  // is currently reading) or manually pinned via the dot navigator.
  const [manualSlide, setManualSlide] = useState(null);
  const currentSection = useMemo(() => {
    if (tele.currentIdx < 0 || tele.currentIdx >= flat.length) return null;
    return flat[tele.currentIdx].sectionId;
  }, [tele.currentIdx, flat]);

  // When the AI moves into a new section, drop any manual override.
  useEffect(() => {
    if (currentSection) setManualSlide(null);
  }, [currentSection]);

  const activeSectionId = manualSlide || currentSection || sections[0]?.id;
  const activeSlideIdx = sections.findIndex((s) => s.id === activeSectionId);
  const activeSection = sections[activeSlideIdx] || sections[0];

  const [askOpen, setAskOpen] = useState(false);

  // Voice commands while the lesson is presenting.
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

  // Stop speech + close modal when the lesson changes.
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

  const resumeCtx = useMemo(() => {
    if (tele.currentIdx < 0 || tele.currentIdx >= flat.length) return null;
    const f = flat[tele.currentIdx];
    return { sectionHeading: f.sectionHeading, sentence: f.text };
  }, [tele.currentIdx, flat]);

  if (!lesson) {
    return (
      <div className="fixed inset-0 bg-white flex items-center justify-center p-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-amber-900">
          Lesson not found.{" "}
          <Link to="/subjects" className="font-semibold underline">
            Back to subjects
          </Link>
        </div>
      </div>
    );
  }

  function goToSlide(idx) {
    const target = sections[idx];
    if (target) setManualSlide(target.id);
  }
  function startSlide() {
    const startIdx = sectionStarts[activeSection.id];
    if (startIdx >= 0) tele.jumpTo(startIdx);
  }

  const progressPct = flat.length
    ? Math.round(((Math.max(tele.currentIdx, 0) + 1) / flat.length) * 100)
    : 0;
  const isSpeaking = tele.state === "playing";

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-100 via-blue-50 to-orange-50 flex flex-col overflow-hidden">
      {/* Presentation top bar */}
      <div className="flex items-center justify-between px-6 py-3 bg-white/80 backdrop-blur border-b border-ink-100 shrink-0">
        <button
          onClick={() => navigate("/subjects")}
          className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-1.5 rounded-lg hover:bg-ink-100"
          title="Exit presentation"
        >
          <CloseIcon className="w-4 h-4" />
          Exit
        </button>

        <div className="flex items-center gap-3 text-sm">
          <div className="font-semibold text-ink-900">{subject.name}</div>
          <span className="text-ink-300">·</span>
          <div className="text-ink-700">{topic.title}</div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-500">Progress</span>
          <div className="h-1.5 w-40 rounded-full bg-ink-100 overflow-hidden">
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

      {/* Slide stage — fills all remaining vertical space */}
      <div className="flex-1 min-h-0 px-6 py-4 lg:px-10 lg:py-6">
        <LessonSlide
          section={activeSection}
          sectionStartIdx={sectionStarts[activeSection?.id] ?? 0}
          currentIdx={tele.currentIdx}
          slideNumber={activeSlideIdx + 1}
          totalSlides={sections.length}
          subject={subject.name}
          topic={topic.title}
          onSentenceClick={(globalIdx) => tele.jumpTo(globalIdx)}
        />
      </div>

      {/* Avatar floats in the bottom-left corner */}
      <div className="absolute bottom-24 left-6 z-30 hidden md:block">
        <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-3 border border-ink-100">
          <TalkingAvatar
            speaking={isSpeaking}
            size="md"
            caption={
              isSpeaking
                ? "Speaking…"
                : tele.state === "paused"
                  ? "Paused"
                  : "Press play"
            }
          />
        </div>
      </div>

      {/* Floating control bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(96vw,60rem)]">
        <div className="bg-white shadow-2xl border border-ink-100 rounded-2xl p-2 flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={isSpeaking ? tele.pause : tele.play}
            disabled={!tele.supported}
            className="w-12 h-12 rounded-full bg-brand-blue text-white text-xl flex items-center justify-center hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={
              isSpeaking
                ? "Pause"
                : tele.state === "paused"
                  ? "Resume"
                  : "Start lesson"
            }
          >
            {isSpeaking ? "⏸" : "▶"}
          </button>

          {/* Stop (only when active) */}
          {tele.state !== "idle" && (
            <button
              onClick={tele.stop}
              className="hidden sm:block px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-100 rounded-lg"
              title="Stop"
            >
              ■
            </button>
          )}

          {/* Speed */}
          {tele.supported && (
            <div className="hidden md:flex items-center gap-1 px-2 border-l border-ink-100">
              <span className="text-[10px] text-ink-500">Speed</span>
              {[0.85, 1, 1.25].map((r) => (
                <button
                  key={r}
                  onClick={() => tele.setRate(r)}
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
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

          {/* Slide dots — clickable */}
          <div className="flex-1 hidden sm:flex justify-center items-center gap-1.5 mx-2">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToSlide(i)}
                title={`${i + 1}. ${s.heading}`}
                className={[
                  "h-2 rounded-full transition-all",
                  i === activeSlideIdx
                    ? "w-8 bg-brand-blue"
                    : "w-2 bg-ink-300 hover:bg-ink-500",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Prev / Next slide */}
          <div className="hidden md:flex items-center gap-1 border-l border-ink-100 pl-2">
            <button
              onClick={() => goToSlide(activeSlideIdx - 1)}
              disabled={activeSlideIdx <= 0}
              className="p-2 text-ink-700 hover:bg-ink-100 rounded-lg disabled:opacity-30"
              title="Previous slide"
            >
              <ArrowLeftIcon className="w-4 h-4" />
            </button>
            {activeSection?.id !== currentSection && (
              <button
                onClick={startSlide}
                className="text-[10px] bg-brand-blue text-white px-2 py-1 rounded-full"
                title="Have the AI read this slide"
              >
                ▶ Read
              </button>
            )}
            <button
              onClick={() => goToSlide(activeSlideIdx + 1)}
              disabled={activeSlideIdx >= sections.length - 1}
              className="p-2 text-ink-700 hover:bg-ink-100 rounded-lg disabled:opacity-30"
              title="Next slide"
            >
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Voice command toggle */}
          {voiceCmd.supported && (
            <button
              onClick={() =>
                voiceCmd.listening ? voiceCmd.stop() : voiceCmd.start()
              }
              className={[
                "w-10 h-10 rounded-full flex items-center justify-center text-base transition-colors shrink-0",
                voiceCmd.listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-ink-100 text-ink-700 hover:bg-brand-blue hover:text-white",
              ].join(" ")}
              title={
                voiceCmd.listening
                  ? "Voice commands ON — say \"pause\", \"continue\""
                  : "Enable voice commands"
              }
            >
              🎙
            </button>
          )}

          {/* Ask AI — the headline action */}
          <button
            onClick={openAskAI}
            className="flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-card"
            title="Pause and ask a question"
          >
            <MicIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>

        {/* Live voice-command transcript bubble */}
        {voiceCmd.listening && voiceCmd.transcript && (
          <div className="mt-2 mx-auto max-w-md bg-ink-900/90 text-white text-xs rounded-full px-3 py-1.5 text-center shadow-card">
            🎙 Heard: "{voiceCmd.transcript}"
          </div>
        )}
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
