import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../store/user";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MicIcon,
  CheckIcon,
} from "../components/icons";
import AskAIModal from "../components/AskAIModal";
import useTeleprompter from "../hooks/useTeleprompter";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { findSubject, findTopic, lessonHref } from "../data/curriculum";
import { getLesson, flattenLesson } from "../data/lessons/index.js";
import mascotImg from "../assets/AI_Lesson.png";
import mathImg from "../assets/Math.png";
import scienceImg from "../assets/Science.png";

const ILLUSTRATION_MAP = { math: mathImg, science: scienceImg };

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

  // Flatten the lesson into a single ordered list of sentences for the
  // teleprompter. `flat[i]` describes the i-th sentence + which section
  // it belongs to.
  const flat = useMemo(() => flattenLesson(lesson), [lesson]);
  const sentences = useMemo(() => flat.map((f) => f.text), [flat]);

  const tele = useTeleprompter(sentences);
  const [askOpen, setAskOpen] = useState(false);

  // Voice-command recognition: listens continuously for short keywords
  // when the student toggles it on. Keywords trigger lesson control
  // without needing to touch the keyboard.
  const voiceCmd = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onCommand: (lower) => {
      if (!lower) return;
      // Match the LAST few words so a long sentence doesn't keep matching.
      const tail = lower.slice(-40);
      if (/\b(i have a question|ask (a |the )?question|wait, question)\b/.test(tail)) {
        if (tele.state === "playing") tele.pause();
        setAskOpen(true);
      } else if (/\b(pause|stop|wait|hold on)\b/.test(tail)) {
        if (tele.state === "playing") tele.pause();
      } else if (/\b(continue|resume|go on|carry on|keep going|play)\b/.test(tail)) {
        if (tele.state === "paused" || tele.state === "idle") tele.play();
      }
    },
  });

  // Auto-scroll the currently-highlighted sentence into view.
  const sentenceRefs = useRef([]);
  useEffect(() => {
    if (tele.currentIdx < 0) return;
    const el = sentenceRefs.current[tele.currentIdx];
    if (el?.scrollIntoView) {
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [tele.currentIdx]);

  // If the topic/lesson changes (e.g. via URL), stop any speech and reset.
  useEffect(() => {
    tele.stop();
    setAskOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // When the AskAI modal opens, pause the lesson. When it closes, resume.
  function openAskAI() {
    if (tele.state === "playing") tele.pause();
    setAskOpen(true);
  }
  function closeAskAI() {
    setAskOpen(false);
    // If we paused on a real sentence, auto-resume.
    if (tele.currentIdx >= 0 && tele.state === "paused") {
      // Small delay so the AI's spoken answer fully stops before lesson resumes.
      setTimeout(() => tele.play(), 250);
    }
  }

  // Context shown inside the modal so the student remembers what was being
  // read when they interrupted.
  const resumeCtx = useMemo(() => {
    if (tele.currentIdx < 0 || tele.currentIdx >= flat.length) return null;
    const f = flat[tele.currentIdx];
    return { sectionHeading: f.sectionHeading, sentence: f.text };
  }, [tele.currentIdx, flat]);

  const illustration =
    subject.image && ILLUSTRATION_MAP[subject.image]
      ? ILLUSTRATION_MAP[subject.image]
      : null;

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

  const progressPct = flat.length
    ? Math.round(((Math.max(tele.currentIdx, 0) + 1) / flat.length) * 100)
    : 0;
  const greetingName = user?.name?.split(" ")[0] || "there";

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

      {/* Placeholder banner */}
      {lesson.isPlaceholder && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded-xl p-3">
          ⚠️ <strong>Placeholder content.</strong> The official Basic Science
          lesson notes are pending. Replace{" "}
          <code className="bg-amber-100 px-1 rounded">
            src/data/lessons/living-things.js
          </code>{" "}
          to use the supplied content.
        </div>
      )}

      {/* Hero / presenter card */}
      <div className="bg-white rounded-2xl shadow-card p-5 flex items-start gap-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
          <img
            src={mascotImg}
            alt="AI Tutor"
            className="h-20 w-20 object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-blue bg-blue-50 rounded-full px-3 py-1">
            ✨ AI Tutor
          </div>
          <h2 className="text-xl font-bold mt-2">
            Hello {greetingName}! 👋 Today's lesson is on{" "}
            <span className="text-brand-blue">{topic.title}</span>.
          </h2>
          <p className="text-xs text-ink-500 mt-1">
            {lesson.classLevel} · {subject.name} · ~{lesson.durationMinutes} min
            · {flat.length} sentences
          </p>

          {/* Objectives */}
          {lesson.objectives?.length > 0 && (
            <div className="mt-3">
              <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-1">
                What you'll learn
              </div>
              <ul className="grid sm:grid-cols-2 gap-1">
                {lesson.objectives.map((o) => (
                  <li
                    key={o}
                    className="text-xs text-ink-700 flex items-start gap-1.5"
                  >
                    <CheckIcon className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                    {o}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        {illustration && (
          <img
            src={illustration}
            alt=""
            className="hidden lg:block w-28 h-28 object-contain shrink-0"
          />
        )}
      </div>

      {/* Lesson body — sectioned, with sentence-level highlight */}
      <div className="bg-white rounded-2xl shadow-card p-6 lg:p-8 space-y-6 leading-relaxed">
        {lesson.sections.map((section) => {
          // Where does this section start/end in the flat sentence array?
          const startIdx = flat.findIndex((f) => f.sectionId === section.id);
          const isActiveSection =
            tele.currentIdx >= 0 &&
            startIdx >= 0 &&
            startIdx <= tele.currentIdx &&
            tele.currentIdx < startIdx + section.sentences.length;

          return (
            <section
              key={section.id}
              id={`section-${section.id}`}
              className="scroll-mt-24"
            >
              <h3
                className={`text-lg font-bold mb-2 transition-colors ${
                  isActiveSection ? "text-brand-blue" : "text-ink-900"
                }`}
              >
                {section.heading}
              </h3>
              <p className="text-base text-ink-700">
                {section.sentences.map((text, i) => {
                  const globalIdx = startIdx + i;
                  const isActive = globalIdx === tele.currentIdx;
                  const isPast =
                    tele.currentIdx >= 0 && globalIdx < tele.currentIdx;
                  return (
                    <span
                      key={i}
                      ref={(el) => (sentenceRefs.current[globalIdx] = el)}
                      onClick={() => tele.jumpTo(globalIdx)}
                      className={[
                        "cursor-pointer transition-all duration-200 rounded px-0.5",
                        isActive
                          ? "bg-yellow-200 text-ink-900 ring-2 ring-yellow-400 shadow-sm"
                          : isPast
                            ? "text-ink-500"
                            : "hover:bg-ink-100",
                      ].join(" ")}
                      title="Click to jump here"
                    >
                      {text}{" "}
                    </span>
                  );
                })}
              </p>
            </section>
          );
        })}
      </div>

      {/* Footer nav — within-subject prev/next would go here, but the demo
          has only one topic per subject. So we just offer "Back to subjects". */}
      <div className="bg-white rounded-2xl shadow-card p-3 flex items-center justify-between gap-2">
        <Link
          to="/subjects"
          className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2"
        >
          <ArrowLeftIcon className="w-4 h-4" /> Back to subjects
        </Link>
        <button
          onClick={() => navigate(`/lesson?subject=${subject.id}&topic=${topic.title}`)}
          className="text-xs text-ink-500 hover:underline"
        >
          Restart from top
        </button>
        <Link
          to="/dashboard"
          className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2"
        >
          Dashboard <ArrowRightIcon className="w-4 h-4" />
        </Link>
      </div>

      {/* Floating control bar — persistent at the bottom of the viewport */}
      <ControlBar
        tele={tele}
        onAskAI={openAskAI}
        totalSentences={flat.length}
        supported={tele.supported}
        voiceCmd={voiceCmd}
      />

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

function ControlBar({ tele, onAskAI, totalSentences, supported, voiceCmd }) {
  const isPlaying = tele.state === "playing";
  const isPaused = tele.state === "paused";

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[min(95vw,44rem)]">
      <div className="bg-white shadow-2xl border border-ink-100 rounded-2xl p-2 flex items-center gap-2">
        {!supported && (
          <div className="px-3 py-2 text-xs text-amber-700">
            Voice not supported in this browser
          </div>
        )}

        <button
          onClick={isPlaying ? tele.pause : tele.play}
          disabled={!supported}
          className="w-12 h-12 rounded-full bg-brand-blue text-white text-xl flex items-center justify-center hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          title={isPlaying ? "Pause lesson" : isPaused ? "Resume lesson" : "Start lesson"}
        >
          {isPlaying ? "⏸" : "▶"}
        </button>

        <div className="hidden sm:flex flex-col items-start min-w-0 px-1">
          <div className="text-[11px] text-ink-500">
            {isPlaying
              ? "🔊 Speaking"
              : isPaused
                ? "Paused"
                : "Press play to start"}
          </div>
          <div className="text-[10px] text-ink-500">
            Sentence {Math.max(tele.currentIdx + 1, 0)} / {totalSentences}
          </div>
        </div>

        {/* Speed control */}
        {supported && (
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

        {tele.state !== "idle" && (
          <button
            onClick={tele.stop}
            className="px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-100 rounded-lg"
            title="Stop lesson"
          >
            ■ Stop
          </button>
        )}

        {/* Voice-command toggle: when on, the student can say
            "pause", "continue", or "I have a question" instead of clicking. */}
        {voiceCmd?.supported && (
          <button
            onClick={() =>
              voiceCmd.listening ? voiceCmd.stop() : voiceCmd.start()
            }
            className={[
              "ml-auto sm:ml-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              voiceCmd.listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-ink-100 text-ink-700 hover:bg-brand-blue hover:text-white",
            ].join(" ")}
            title={
              voiceCmd.listening
                ? "Voice commands ON — say \"pause\", \"continue\", or \"I have a question\""
                : "Turn on voice commands"
            }
          >
            🎙
          </button>
        )}

        <button
          onClick={onAskAI}
          className="ml-auto flex items-center gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white text-sm font-semibold px-4 py-2.5 rounded-full shadow-card"
          title="Pause and ask a question"
        >
          <MicIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Ask AI</span>
        </button>
      </div>

      {/* Live transcript bubble while voice commands are listening */}
      {voiceCmd?.listening && voiceCmd.transcript && (
        <div className="mt-2 mx-auto max-w-md bg-ink-900/90 text-white text-xs rounded-full px-3 py-1.5 text-center shadow-card">
          🎙 Heard: "{voiceCmd.transcript}"
        </div>
      )}
    </div>
  );
}
