import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../store/user";
import { ArrowLeftIcon, ArrowRightIcon, MicIcon, CloseIcon } from "../components/icons";
import AskAIModal from "../components/AskAIModal";
import TalkingAvatar from "../components/TalkingAvatar";
import LessonSlide from "../components/LessonSlide";
import KindergartenSlide from "../components/KindergartenSlide";
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
  // Subject decides the AI tutor's voice: maths → male, science → female.
  // classLevel decides the speaking rate (Kindergarten reads slower).
  const tele = useTeleprompter(sentences, {
    preferredGender: subject.voiceGender || "any",
    classLevel: lesson?.classLevel,
    onSentenceEnd: async ({ text }) => {
      // Only the kindergarten flow runs the verify mini-game — older
      // students don't pause mid-lesson to chant words back.
      if (!isKindergarten) return;
      const target = extractRepeatTarget(text);
      if (!target) return;
      await runVerify(target);
    },
  });

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
  // On mobile/tablet the presenter column is hidden by default; this toggle
  // shows a slide-over panel with the avatar + controls.
  const [presenterOpen, setPresenterOpen] = useState(false);

  // Direct voice convo state (Kindergarten only): the kid just talks,
  // we send the transcript to /api/chat, then the AI's reply is read
  // aloud while showing as a friendly bubble at the bottom of the slide.
  const [aiReply, setAiReply] = useState("");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const lastUserTextRef = useRef("");

  // Verify state: "Say it with me. Apple." → the teacher waits for the
  // child to actually say "Apple", up to MAX_VERIFY_ATTEMPTS times.
  const [verifyTarget, setVerifyTarget] = useState(null); // displayed in UI
  const [verifyAttempt, setVerifyAttempt] = useState(0);
  // The actual matching is done off-state via refs so it lives across
  // promise resolutions without re-render races.
  const verifyTargetRef = useRef(null);  // lowercased word we're listening for
  const verifyResolverRef = useRef(null); // resolve(true|false) when heard / timed out

  const isKindergarten = lesson?.classLevel === "Kindergarten";

  const voiceCmd = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onCommand: (lower) => {
      if (!lower) return;
      const tail = lower.slice(-80);

      // Verify mode wins over everything else — when the teacher just
      // asked the child to repeat a word, the only thing we care about
      // is whether they said it.
      if (verifyTargetRef.current) {
        const target = verifyTargetRef.current;
        if (tail.includes(target)) {
          verifyResolverRef.current?.(true);
        }
        return;
      }

      if (/\b(pause|stop|wait|hold on)\b/.test(tail)) {
        if (tele.state === "playing") tele.pause();
        return;
      }
      if (/\b(continue|resume|go on|carry on|keep going|play)\b/.test(tail)) {
        if (tele.state === "paused" || tele.state === "idle") tele.play();
        return;
      }

      // Kindergarten: anything substantive becomes a question to the AI
      // — no buttons, no modal, just talk. Older students still use the
      // explicit "I have a question" trigger so they don't drown out
      // each other in a classroom.
      if (isKindergarten) {
        const text = tail.trim();
        if (text.length >= 4 && /[a-z]/.test(text) && text !== lastUserTextRef.current) {
          askAIDirect(text);
        }
      } else if (/\b(i have a question|ask (a |the )?question|wait,? question)\b/.test(tail)) {
        if (tele.state === "playing") tele.pause();
        setAskOpen(true);
      }
    },
  });

  // ─── Direct AI chat used by the kindergarten voice loop ────────────
  async function askAIDirect(text) {
    if (aiBusy) return;
    lastUserTextRef.current = text;
    if (tele.state === "playing") tele.pause();
    voiceCmd.stop(); // mute mic while we think + speak
    setAiBusy(true);
    setAiReply("…");
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
          context: {
            classLevel: lesson.classLevel,
            subject: subject.name,
            topic: topic.title,
            // Tell the AI exactly which letter the child is on right
            // now so its reply stays in scope. Without this, replies
            // wander to other letters (e.g. user is on K but AI
            // suggests starting with A).
            currentLetter: activeSection?.visual?.letter,
            currentWord: activeSection?.visual?.word,
          },
        }),
      });
      const data = await r.json();
      const reply = data?.reply || "Hmm, can you say that again?";
      setAiReply(reply);
      speakAIReply(reply);
    } catch (err) {
      console.warn("[direct-voice] askAIDirect failed:", err);
      setAiReply("Oops! Try again.");
      setAiBusy(false);
    }
  }

  function speakAIReply(text) {
    if (!text || !("speechSynthesis" in window)) {
      setAiBusy(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 0.95;
    u.pitch = subject.voiceGender === "female" ? 1.15 : 0.95;
    u.onstart = () => setAiSpeaking(true);
    u.onend = () => {
      setAiSpeaking(false);
      setAiBusy(false);
      // After the teacher finishes speaking, re-open the mic so the
      // child can answer naturally. Tiny delay avoids the synthesis
      // tail being picked up as input.
      setTimeout(() => {
        if (voiceCmd.supported && isKindergarten) voiceCmd.start();
      }, 350);
    };
    u.onerror = () => {
      setAiSpeaking(false);
      setAiBusy(false);
    };
    window.speechSynthesis.speak(u);
  }

  // ─── Verify "Say it with me, X" mini-game ──────────────────────────
  // Wired from useTeleprompter via the onSentenceEnd hook. Listens for
  // up to MAX_VERIFY_ATTEMPTS for the child to repeat the target word.

  // Speak a phrase and wait for the audio to finish. Used to chain
  // praise/retry prompts in sequence without overlap.
  function speakAndWait(text) {
    return new Promise((resolve) => {
      if (!text || !("speechSynthesis" in window)) return resolve();
      // Mute the mic for the duration so our own prompt doesn't loop
      // back in as the child's "answer".
      if (voiceCmd.supported && voiceCmd.listening) voiceCmd.stop();
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.95;
      u.pitch = subject.voiceGender === "female" ? 1.15 : 0.95;
      u.onstart = () => setAiSpeaking(true);
      u.onend = () => {
        setAiSpeaking(false);
        resolve();
      };
      u.onerror = () => {
        setAiSpeaking(false);
        resolve();
      };
      window.speechSynthesis.speak(u);
    });
  }

  // One round of listening for the target word. Resolves true if the
  // child's mic transcript contains the word within the timeout.
  function listenForWord(targetLower, timeoutMs = 5000) {
    return new Promise((resolve) => {
      verifyTargetRef.current = targetLower;
      // Make sure the mic is on
      if (voiceCmd.supported && !voiceCmd.listening) voiceCmd.start();
      const timer = setTimeout(() => {
        verifyTargetRef.current = null;
        verifyResolverRef.current = null;
        resolve(false);
      }, timeoutMs);
      verifyResolverRef.current = (matched) => {
        clearTimeout(timer);
        verifyTargetRef.current = null;
        verifyResolverRef.current = null;
        resolve(matched);
      };
    });
  }

  const MAX_VERIFY_ATTEMPTS = 3;
  const PRAISES = ["Wow, great job!", "Perfect!", "Excellent!", "You did it!"];
  const RETRIES = [
    "Almost! Try again. Say",
    "Let's try one more time. Say",
    "Nearly there! Can you say",
  ];

  async function runVerify(rawTarget) {
    const targetWord = rawTarget.trim();
    const targetLower = targetWord.toLowerCase();
    setVerifyTarget(targetWord);
    setVerifyAttempt(1);

    for (let attempt = 1; attempt <= MAX_VERIFY_ATTEMPTS; attempt++) {
      setVerifyAttempt(attempt);
      if (attempt > 1) {
        const prompt = RETRIES[(attempt - 2) % RETRIES.length];
        await speakAndWait(`${prompt} ${targetWord}.`);
      }
      const heard = await listenForWord(targetLower, 5000);
      if (heard) {
        const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
        await speakAndWait(`${praise} ${targetWord}!`);
        setVerifyTarget(null);
        setVerifyAttempt(0);
        return true;
      }
    }
    await speakAndWait(`That's okay. Let's keep going.`);
    setVerifyTarget(null);
    setVerifyAttempt(0);
    return false;
  }

  // "Say it with me. Apple." → "Apple"
  // "Now let's clap. A, A, A!" → "A"  (alphabet's call-and-response line)
  function extractRepeatTarget(text) {
    if (!text) return null;
    let m = text.match(/say it with me[.,!]?\s*([A-Za-z][A-Za-z\s]+?)[.!?]/i);
    if (m) return m[1].trim();
    m = text.match(/now let's clap[.,!]?\s*([A-Za-z])(?:,\s*\1){1,}/i);
    if (m) return m[1].trim();
    return null;
  }

  // ─── Continuous-mic management for Kindergarten ────────────────────
  // Auto-start mic when the lesson opens; pause it while the teacher
  // teleprompter is speaking (otherwise the mic picks up its own voice).
  //
  // Verify mode owns the mic exclusively — listenForWord() and
  // speakAndWait() drive it directly so this effect MUST get out of
  // their way once a target is set, otherwise we fight ourselves and
  // either drop the child's reply or echo our own prompt back in.
  useEffect(() => {
    if (!isKindergarten || !voiceCmd.supported) return;
    if (verifyTarget) return;
    if (tele.state === "playing" || aiBusy || aiSpeaking) {
      if (voiceCmd.listening) voiceCmd.stop();
    } else {
      if (!voiceCmd.listening) voiceCmd.start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tele.state, aiBusy, aiSpeaking, isKindergarten, voiceCmd.supported, verifyTarget]);

  // Clear the AI reply bubble a few seconds after the AI stops talking
  useEffect(() => {
    if (!aiReply || aiSpeaking || aiBusy) return;
    const t = setTimeout(() => setAiReply(""), 6000);
    return () => clearTimeout(t);
  }, [aiReply, aiSpeaking, aiBusy]);

  // ─── Preload next two letters' photo + video assets ────────────────
  // The image/video API caches on the server — these warm-up fetches
  // mean the next slide is INSTANT when the kid gets there.
  useEffect(() => {
    if (!isKindergarten) return;
    const upcoming = sections.slice(activeSlideIdx + 1, activeSlideIdx + 3);
    upcoming.forEach((s) => {
      const v = s?.visual;
      if (v?.type !== "kg-letter" || !v.word) return;
      const body = JSON.stringify({ word: v.word, hint: v.photoHint });
      const opts = { method: "POST", headers: { "Content-Type": "application/json" }, body };
      fetch("/api/image", opts).catch(() => {});
      fetch("/api/video", opts).catch(() => {});
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlideIdx, lesson?.id]);

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

  const presenterContent = (
    <>
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
        presenterName={subject.presenterName || "AI Tutor"}
        teacherSeed={subject.voiceGender === "female" ? "Mrs+Adesua" : "Mr+Adebayo"}
        showNamePlate
        allowChange
      />
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
      {voiceCmd.listening && voiceCmd.transcript && (
        <div className="mt-2 w-full bg-ink-900 text-white text-[11px] rounded-lg px-2 py-1.5 text-center">
          🎙 "{voiceCmd.transcript}"
        </div>
      )}
    </>
  );

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
      <div className="relative z-10 flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 bg-slate-900/60 backdrop-blur-lg border-b border-white/10 shrink-0 gap-2">
        <button
          onClick={() => navigate("/subjects")}
          className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium text-white/90 hover:text-white px-2 sm:px-3 py-1.5 rounded-lg hover:bg-white/10 shrink-0"
          title="Exit presentation"
        >
          <CloseIcon className="w-4 h-4" />
          <span className="hidden sm:inline">Exit</span>
        </button>

        <div className="flex items-center gap-2 text-xs sm:text-sm text-white min-w-0 flex-1 justify-center">
          <div className="font-bold truncate">{subject.name}</div>
          <span className="text-white/40 shrink-0">·</span>
          <div className="text-white/80 truncate">{topic.title}</div>
        </div>

        {/* Mobile: hamburger for presenter panel */}
        <button
          onClick={() => setPresenterOpen(true)}
          className="lg:hidden text-white/90 hover:text-white px-2 py-1.5 rounded-lg hover:bg-white/10 shrink-0"
          title="Show presenter"
          aria-label="Show presenter"
        >
          👤
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs shrink-0">
          <span className="text-white/60 hidden md:inline">Progress</span>
          <div className="h-1.5 w-24 lg:w-40 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-orange to-brand-orange-light transition-all"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="font-semibold tabular-nums w-9 text-right text-white">
            {progressPct}%
          </span>
        </div>
      </div>

      {/* Main stage */}
      <div className="relative z-10 flex-1 min-h-0 flex gap-3 sm:gap-4 lg:gap-6 px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6 overflow-hidden">
        {/* Presenter column — desktop sidebar */}
        <aside className="hidden lg:flex shrink-0 w-72 xl:w-80 flex-col items-center bg-white/95 backdrop-blur rounded-3xl shadow-2xl p-6 border border-white/40 overflow-y-auto">
          {presenterContent}
        </aside>

        {/* Slide column */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Mobile-only mini avatar header */}
          <div className="lg:hidden bg-white/95 rounded-2xl shadow-card p-2.5 mb-3 flex items-center gap-3">
            <TalkingAvatar speaking={isSpeaking} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-ink-500 font-bold">
                {subject.presenterName || "AI Tutor"}
              </div>
              <div className="text-xs text-ink-700 truncate">
                {isSpeaking
                  ? "Speaking…"
                  : tele.state === "paused"
                    ? "Paused"
                    : "Ready"}
              </div>
            </div>
            <button
              onClick={() => setPresenterOpen(true)}
              className="text-xs text-brand-blue font-semibold px-2 py-1 rounded-md hover:bg-blue-50"
            >
              Open
            </button>
          </div>

          <div className="flex-1 min-h-0">
            {lesson.layout === "kindergarten" ? (
              <KindergartenSlide
                section={activeSection}
                sectionStartIdx={sectionStarts[activeSection?.id] ?? 0}
                currentIdx={tele.currentIdx}
                slideNumber={activeSlideIdx + 1}
                totalSlides={sections.length}
                subject={subject.name}
                topic={topic.title}
                onSentenceClick={(globalIdx) => tele.jumpTo(globalIdx)}
                onReplay={() => {
                  const startIdx = sectionStarts[activeSection?.id];
                  if (startIdx >= 0) tele.jumpTo(startIdx);
                }}
              />
            ) : (
              <LessonSlide
                section={activeSection}
                sectionStartIdx={sectionStarts[activeSection?.id] ?? 0}
                currentIdx={tele.currentIdx}
                slideNumber={activeSlideIdx + 1}
                totalSlides={sections.length}
                subject={subject.name}
                topic={topic.title}
                tint={subject.tint}
                onSentenceClick={(globalIdx) => tele.jumpTo(globalIdx)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Direct-voice listening badge — kindergarten only, top-center */}
      {isKindergarten && voiceCmd.supported && (
        <div className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <div
            className={[
              "flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg backdrop-blur",
              verifyTarget
                ? "bg-amber-400/95 text-ink-900"
                : voiceCmd.listening
                  ? "bg-emerald-500/95 text-white"
                  : aiSpeaking || aiBusy
                    ? "bg-rose-500/95 text-white"
                    : "bg-white/90 text-ink-700",
            ].join(" ")}
          >
            <span
              className={[
                "w-2 h-2 rounded-full",
                verifyTarget
                  ? "bg-white animate-pulse"
                  : voiceCmd.listening
                    ? "bg-white animate-ping"
                    : aiSpeaking
                      ? "bg-white animate-pulse"
                      : "bg-ink-400",
              ].join(" ")}
            />
            {verifyTarget
              ? `Your turn! Say "${verifyTarget}" (${verifyAttempt}/${MAX_VERIFY_ATTEMPTS})`
              : aiBusy
                ? "Thinking…"
                : aiSpeaking
                  ? "Aunty Adesua is speaking"
                  : voiceCmd.listening
                    ? "Listening — just talk!"
                    : "Mic off"}
          </div>
        </div>
      )}

      {/* Inline AI reply bubble — bottom of stage, kindergarten only */}
      {isKindergarten && aiReply && (
        <div className="absolute bottom-24 sm:bottom-28 left-1/2 -translate-x-1/2 z-30 max-w-xl px-4 pointer-events-none">
          <div className="bg-white shadow-2xl rounded-3xl px-5 py-3 border border-rose-100 animate-[fadeIn_0.25s_ease-out]">
            <div className="text-[10px] uppercase tracking-wider font-bold text-rose-500 mb-0.5">
              Aunty Adesua
            </div>
            <div className="text-sm sm:text-base text-ink-900 leading-snug whitespace-pre-wrap">
              {aiReply}
            </div>
          </div>
        </div>
      )}

      {/* Mobile presenter slide-over panel */}
      {presenterOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-ink-900/60 backdrop-blur-sm flex"
          onClick={() => setPresenterOpen(false)}
        >
          <div
            className="ml-auto w-[88%] max-w-sm h-full bg-white flex flex-col items-center p-5 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setPresenterOpen(false)}
              className="self-end mb-2 w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-500"
              aria-label="Close presenter"
            >
              <CloseIcon className="w-5 h-5" />
            </button>
            {presenterContent}
          </div>
        </div>
      )}

      {/* Floating control bar */}
      <div className="relative z-20 px-3 sm:px-4 lg:px-8 pb-3 sm:pb-4">
        <div className="bg-white shadow-2xl border border-white/40 rounded-2xl p-2 flex items-center gap-1.5 sm:gap-2 overflow-x-auto">
          <button
            onClick={isSpeaking ? tele.pause : tele.play}
            disabled={!tele.supported}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-brand-blue text-white text-xl flex items-center justify-center hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed shrink-0 shadow-card"
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

          {tele.state !== "idle" && (
            <button
              onClick={tele.stop}
              className="hidden sm:block px-3 py-2 text-xs font-medium text-ink-700 hover:bg-ink-100 rounded-lg shrink-0"
              title="Stop"
            >
              ■
            </button>
          )}

          {tele.supported && (
            <div className="hidden md:flex items-center gap-1 px-2 border-l border-ink-100 shrink-0">
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

          {/* Slide dots — hidden on small screens */}
          <div className="flex-1 hidden sm:flex justify-center items-center gap-1.5 mx-2 min-w-0">
            {sections.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goToSlide(i)}
                title={`${i + 1}. ${s.heading}`}
                className={[
                  "h-2 rounded-full transition-all shrink-0",
                  i === activeSlideIdx
                    ? "w-8 bg-brand-blue"
                    : "w-2 bg-ink-300 hover:bg-ink-500",
                ].join(" ")}
              />
            ))}
          </div>

          {/* Mobile: compact slide counter */}
          <div className="sm:hidden flex-1 text-center text-xs font-semibold text-ink-700 tabular-nums">
            {activeSlideIdx + 1} / {sections.length}
          </div>

          <div className="flex items-center gap-1 border-l border-ink-100 pl-2 shrink-0">
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
                className="text-[10px] bg-brand-blue text-white px-2 py-1 rounded-full hidden md:block"
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

          <button
            onClick={openAskAI}
            className="flex items-center gap-1.5 sm:gap-2 bg-brand-orange hover:bg-brand-orange-dark text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-card shrink-0"
            title="Pause and ask a question"
          >
            <MicIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>
        </div>
      </div>

      <AskAIModal
        open={askOpen}
        lesson={lesson}
        resumeContext={resumeCtx}
        classLevel={user?.classLevel || lesson.classLevel}
        preferredGender={subject.voiceGender || "any"}
        presenterName={subject.presenterName || "AI Tutor"}
        onClose={closeAskAI}
      />
    </div>
  );
}
