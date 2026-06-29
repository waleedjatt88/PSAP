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

  const [manualSlide, setManualSlide] = useState(null);
  const currentSection = useMemo(() => {
    if (tele.currentIdx < 0 || tele.currentIdx >= flat.length) return null;
    return flat[tele.currentIdx].sectionId;
  }, [tele.currentIdx, flat]);

  useEffect(() => {
    if (currentSection) setManualSlide(null);
  }, [currentSection]);

  const activeSectionId = manualSlide || currentSection || sections[0]?.id;
  const activeSlideIdx = sections.findIndex((s) => s.id === activeSectionId);
  const activeSection = sections[activeSlideIdx] || sections[0];

  const [askOpen, setAskOpen] = useState(false);

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
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-800 flex flex-col overflow-hidden">
      {/* Subtle dot pattern overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-6 py-3 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 shrink-0">
        <button
          onClick={() => navigate("/subjects")}
          className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10"
          title="Exit presentation"
        >
          <CloseIcon className="w-4 h-4" />
          Exit
        </button>

        <div className="flex items-center gap-3 text-sm text-white">
          <div className="font-bold">{subject.name}</div>
          <span className="text-white/40">·</span>
          <div className="text-white/80">{topic.title}</div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/60">Progress</span>
          <div className="h-1.5 w-40 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-semibold tabular-nums w-10 text-right text-white">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Main stage — presenter column + slide column */}
      <div className="relative z-10 flex-1 min-h-0 flex gap-4 lg:gap-6 px-4 lg:px-8 py-4 lg:py-6">
        {/* Presenter column (avatar) */}
        <aside className="hidden lg:flex shrink-0 w-72 xl:w-80 flex-col items-center bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-6 border border-white/40">
          <div className="mb-4 text-center">
            <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-brand-blue">
              Your AI Teacher
            </div>
            <div className="text-xs text-ink-500 mt-0.5">
              Live · {lesson.classLevel} · {subject.name}
            </div>
          </div>

          <TalkingAvatar
            speaking={isSpeaking}
            size="xl"
            presenterName="Mr. Adebayo · AI Tutor"
            showNamePlate
            allowChange
          />

          {/* Live status under the avatar */}
          <div className="mt-5 w-full bg-ink-100/60 rounded-2xl p-3 text-center">
            <div className="text-[10px] uppercase tracking-wide text-ink-500 font-bold">
              {isSpeaking
                ? "Now teaching"
                : tele.state === "paused"
                  ? "Paused on"
                  : "Ready to start"}
            </div>
            <div className="text-xs text-ink-700 mt-1 line-clamp-2 min-h-[2.4em]">
              {tele.currentIdx >= 0
                ? `Slide ${activeSlideIdx + 1}: ${activeSection.heading}`
                : `Press play to begin`}
            </div>
            <div className="text-[10px] text-ink-500 mt-1 tabular-nums">
              Sentence {Math.max(tele.currentIdx + 1, 0)} of {flat.length}
            </div>
          </div>

          {/* Quick voice command toggle */}
          {voiceCmd.supported && (
            <button
              onClick={() =>
                voiceCmd.listening ? voiceCmd.stop() : voiceCmd.start()
              }
              className={[
                "mt-3 w-full text-xs font-semibold py-2.5 rounded-full transition-colors flex items-center justify-center gap-2",
                voiceCmd.listening
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-ink-100 text-ink-700 hover:bg-brand-blue hover:text-white",
              ].join(" ")}
            >
              🎙{" "}
              {voiceCmd.listening
                ? "Listening for commands…"
                : "Enable voice commands"}
            </button>
          )}

          {/* Live transcript */}
          {voiceCmd.listening && voiceCmd.transcript && (
            <div className="mt-2 w-full bg-ink-900 text-white text-[11px] rounded-lg px-2 py-1.5 text-center">
              🎙 "{voiceCmd.transcript}"
            </div>
          )}
        </aside>

        {/* Slide column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile-only mini avatar bar */}
          <div className="lg:hidden bg-white/95 rounded-2xl shadow-card p-3 mb-3 flex items-center gap-3">
            <TalkingAvatar speaking={isSpeaking} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-ink-500 font-bold">
                Mr. Adebayo · AI Tutor
              </div>
              <div className="text-xs text-ink-700 truncate">
                {isSpeaking ? "Speaking…" : tele.state === "paused" ? "Paused" : "Ready"}
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0">
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
        </div>
      </div>

      {/* Floating control bar */}
      <div className="relative z-20 px-4 lg:px-8 pb-4">
        <div className="bg-white shadow-2xl border border-white/40 rounded-2xl p-2 flex items-center gap-2">
          {/* Play / Pause */}
          <button
            onClick={isSpeaking ? tele.pause : tele.play}
            disabled={!tele.supported}
            className="w-12 h-12 rounded-full bg-brand-blue text-white text-xl flex items-center justify-center hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-card"
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

          {/* Stop */}
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

          {/* Slide dots */}
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

          {/* Prev / Next */}
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
