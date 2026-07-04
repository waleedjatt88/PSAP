import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useUser } from "../store/user";
import {
  ArrowRightIcon,
  MicIcon,
  CloseIcon,
  CheckIcon,
  MenuIcon,
  ExpandIcon,
  MinimizeIcon,
  PlayIcon,
  PauseIcon,
  StopIcon,
  HomeIcon,
  ChartIcon,
  TrophyIcon,
  BookmarkIcon,
  SettingsIcon,
  BookIcon,
  StarIcon,
} from "../components/icons";
import AskAIModal from "../components/AskAIModal";
import TalkingAvatar from "../components/TalkingAvatar";
import LessonSlide from "../components/LessonSlide";
import KindergartenSlide from "../components/KindergartenSlide";
import useTeleprompter from "../hooks/useTeleprompter";
import useSpeechRecognition from "../hooks/useSpeechRecognition";
import { SUBJECTS, findSubject, findTopic, lessonHref } from "../data/curriculum";
import { getLesson, flattenLesson } from "../data/lessons/index.js";
import { letterImage, TEACHER_AVATAR } from "../data/lessons/alphabetAssets.js";

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
    onSentenceEnd: async ({ idx, text }) => {
      // Only the kindergarten flow runs the verify mini-game — older
      // students don't pause mid-lesson to chant words back.
      if (!isKindergarten) return;
      const target =
        extractRepeatTarget(text) || extractQuestionTarget(text, flat[idx]);
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
  // Both side panels are collapsible via the header Menu / Lessons buttons.
  // They start open on wide screens and closed on small ones so the stage
  // isn't buried on a phone.
  const [presenterOpen, setPresenterOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const [lessonsOpen, setLessonsOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1280,
  );
  // Present mode = clean full-screen slide view (chrome hidden).
  const [presentMode, setPresentMode] = useState(false);

  // ── Keyboard controls (PowerPoint-style, work in full screen) ──────
  // →/Space = next slide, ← = previous, Esc = leave present mode. The
  // slide stays on screen the whole time (keys never drop full screen).
  // Placed above the `if (!lesson) return` guard below so the Hook always
  // runs in the same order on every render (Rules of Hooks).
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = (t?.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || t?.isContentEditable) return;
      if (askOpen) return; // let the Ask-AI dialog handle keys
      switch (e.key) {
        case "ArrowRight":
        case "PageDown":
          e.preventDefault();
          if (activeSlideIdx < sections.length - 1) goToSlide(activeSlideIdx + 1);
          break;
        case "ArrowLeft":
        case "PageUp":
          e.preventDefault();
          if (activeSlideIdx > 0) goToSlide(activeSlideIdx - 1);
          break;
        case " ":
          e.preventDefault();
          if (tele.state === "playing") tele.pause();
          else tele.play();
          break;
        case "Escape":
          if (presentMode) exitPresent();
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlideIdx, sections.length, askOpen, tele.state, presentMode]);

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
  const verifyTargetRef = useRef(null);  // array of accepted answers we're listening for
  const verifyResolverRef = useRef(null); // resolve(true|false) when heard / timed out
  // Bumped on every new verify AND on cancel — a running runVerify()
  // compares its own generation after every await and bails out silently
  // when it no longer matches (e.g. the child said "next" mid-question).
  const verifyGenRef = useRef(0);
  // True for the WHOLE runVerify() run, including the gaps between
  // listening windows while a retry prompt is being spoken. Those gaps
  // are where stray mic input used to leak into the AI chat and put two
  // teacher voices on screen at once — this flag keeps the AI chat and
  // every other voice flow locked out until the question is settled.
  const verifyActiveRef = useRef(false);

  const isKindergarten = lesson?.classLevel === "Kindergarten";

  const voiceCmd = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onCommand: (lower) => {
      if (!lower) return;
      const tail = lower.slice(-80);

      // Voice navigation — "next lesson" jumps straight to the next
      // topic; "next" moves one slide forward (rolling into the next
      // lesson from the last slide); "go back" returns one slide.
      // Detected once here; it also breaks out of an active question.
      const navCmd = /\bnext lesson\b/.test(tail)
        ? "lesson"
        : /\b(next|move on)\b/.test(tail)
          ? "forward"
          : /\b(go back|previous)\b/.test(tail)
            ? "back"
            : null;
      const runNav = () => {
        if (navCmd === "lesson") goToNextLesson();
        else if (navCmd === "forward") navBySpeech(1);
        else navBySpeech(-1);
      };

      // Verify mode wins over everything else — when the teacher just
      // asked the child to repeat a word (or answer a question), the
      // only thing we care about is whether they said it. Accepted
      // forms is an array ("five" and "5") matched on word boundaries
      // so a stray letter inside another word doesn't count as correct.
      if (verifyTargetRef.current) {
        const targets = verifyTargetRef.current;
        if (
          targets.some((t) =>
            new RegExp(`\\b${escapeRegExp(t)}\\b`, "i").test(tail),
          )
        ) {
          verifyResolverRef.current?.(true);
        } else if (navCmd) {
          runNav();
        }
        return;
      }

      // Between listening windows of the same question (a retry prompt
      // is being spoken) — nothing may interrupt except navigation.
      // This is what used to leak into the AI chat and produce TWO
      // teacher voices talking over each other.
      if (verifyActiveRef.current) {
        if (navCmd) runNav();
        return;
      }

      if (navCmd) {
        runNav();
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
    // Never talk over an active "say it with me" / question round —
    // one teacher voice at a time.
    if (aiBusy || verifyActiveRef.current) return;
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
  // child's mic transcript contains any accepted form within the timeout.
  function listenForWord(targets, timeoutMs = 5000) {
    return new Promise((resolve) => {
      verifyTargetRef.current = targets;
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

  // Cancel any in-flight verify: unblock listenForWord, silence the
  // prompt being spoken, and clear the UI. The generation bump makes the
  // still-running runVerify() loop return without speaking another word
  // — otherwise the previous letter's question keeps playing on top of
  // the slide/lesson the child just navigated to.
  function cancelVerify() {
    verifyGenRef.current++;
    verifyActiveRef.current = false;
    verifyResolverRef.current?.(false);
    verifyTargetRef.current = null;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    setVerifyTarget(null);
    setVerifyAttempt(0);
  }

  async function runVerify(rawTarget) {
    const myGen = ++verifyGenRef.current;
    verifyActiveRef.current = true;
    const targetWord = rawTarget.trim();
    const targets = acceptedAnswers(targetWord);
    setAiReply(""); // drop any lingering chat bubble — one teacher at a time
    setVerifyTarget(targetWord);
    setVerifyAttempt(1);

    try {
      for (let attempt = 1; attempt <= MAX_VERIFY_ATTEMPTS; attempt++) {
        setVerifyAttempt(attempt);
        if (attempt > 1) {
          const prompt = RETRIES[(attempt - 2) % RETRIES.length];
          await speakAndWait(`${prompt} ${targetWord}.`);
          if (verifyGenRef.current !== myGen) return false; // cancelled
        }
        const heard = await listenForWord(targets, 5000);
        if (verifyGenRef.current !== myGen) return false; // cancelled
        if (heard) {
          const praise = PRAISES[Math.floor(Math.random() * PRAISES.length)];
          await speakAndWait(`${praise} ${targetWord}!`);
          setVerifyTarget(null);
          setVerifyAttempt(0);
          return true;
        }
      }
      await speakAndWait(`That's okay. Let's keep going.`);
      if (verifyGenRef.current !== myGen) return false; // cancelled
      setVerifyTarget(null);
      setVerifyAttempt(0);
      return false;
    } finally {
      // Only clear the busy flag if this run is still the latest one —
      // a cancel + newer verify may already own it.
      if (verifyGenRef.current === myGen) verifyActiveRef.current = false;
    }
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

  // "Now a question. What number is this?" → the answer lives in the
  // section the sentence belongs to (word for numbers, name for shapes,
  // letter for the alphabet). Returns null for non-question sentences.
  function extractQuestionTarget(text, flatItem) {
    if (!text || !/what (number|shape|letter|word) is this/i.test(text)) {
      return null;
    }
    const section = sections.find((s) => s.id === flatItem?.sectionId);
    const v = section?.visual;
    return v?.word || v?.name || v?.letter || null;
  }

  function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  // Speech recognition often writes small numbers as digits ("5" for
  // "five"), so a number answer is accepted in both spellings.
  const NUMBER_WORD_DIGITS = {
    one: "1", two: "2", three: "3", four: "4", five: "5",
    six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  };
  function acceptedAnswers(word) {
    const lower = word.toLowerCase();
    const forms = [lower];
    if (NUMBER_WORD_DIGITS[lower]) forms.push(NUMBER_WORD_DIGITS[lower]);
    return forms;
  }

  // ─── Voice navigation ("next", "go back", "next lesson") ───────────
  // Continuous recognition keeps appending to one transcript, so the
  // same command can arrive twice in quick succession — the timestamp
  // guard swallows the echo. Stopping the mic clears the transcript;
  // the kindergarten mic-management effect restarts it afterwards.
  const lastNavAtRef = useRef(0);
  function navGuard() {
    const now = Date.now();
    if (now - lastNavAtRef.current < 1500) return false;
    lastNavAtRef.current = now;
    return true;
  }

  function navBySpeech(dir) {
    if (!navGuard()) return;
    const nextIdx = activeSlideIdx + dir;
    if (nextIdx >= 0 && nextIdx < sections.length) {
      cancelVerify(); // kill any pending question from the old slide
      voiceCmd.stop();
      const target = sections[nextIdx];
      setManualSlide(target.id);
      const startIdx = sectionStarts[target.id];
      if (startIdx >= 0) tele.jumpTo(startIdx);
    } else if (dir > 0) {
      goToNextLessonInner();
    }
  }

  function goToNextLesson() {
    if (!navGuard()) return;
    goToNextLessonInner();
  }

  // Next topic in this subject, else the first topic of the next
  // subject in the same class tier (Letters → Numbers → … → Science).
  function goToNextLessonInner() {
    const topics = subject?.topics || [];
    const topicIdx = topics.findIndex((t) => t.title === topic.title);
    const nextTopic = topics[topicIdx + 1];
    let href = null;
    if (nextTopic) {
      href = lessonHref(subject.id, nextTopic.title);
    } else {
      const tierSubjects = SUBJECTS.filter(
        (s) => s.classTier === subject.classTier,
      );
      const subjIdx = tierSubjects.findIndex((s) => s.id === subject.id);
      const nextSubject = tierSubjects[subjIdx + 1];
      if (nextSubject?.topics?.length) {
        href = lessonHref(nextSubject.id, nextSubject.topics[0].title);
      }
    }
    if (!href) return; // already on the very last lesson
    cancelVerify(); // kill any pending question from the old lesson
    voiceCmd.stop();
    tele.stop();
    navigate(href);
    // Same route, new query params — the component stays mounted, so we
    // kick the teleprompter off from the top once the new lesson's
    // sentences have flowed into it (next render + ref sync).
    setTimeout(() => tele.jumpTo(0), 800);
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

  // ─── Preload next two letters' photo SET + video assets ────────────
  // The image/video API caches on the server — these warm-up fetches
  // mean the next slide is INSTANT when the kid gets there.
  useEffect(() => {
    if (!isKindergarten) return;
    const upcoming = sections.slice(activeSlideIdx + 1, activeSlideIdx + 3);
    const headers = { "Content-Type": "application/json" };
    upcoming.forEach((s) => {
      const v = s?.visual;
      if (v?.type !== "kg-letter" || !v.word) return;
      fetch("/api/images", {
        method: "POST",
        headers,
        body: JSON.stringify({ word: v.word, hint: v.photoHint, count: 6 }),
      }).catch(() => { });
      fetch("/api/video", {
        method: "POST",
        headers,
        body: JSON.stringify({ word: v.word, hint: v.videoHint || v.photoHint }),
      }).catch(() => { });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSlideIdx, lesson?.id]);

  useEffect(() => {
    tele.stop();
    setAskOpen(false);
    setManualSlide(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson?.id]);

  // When the speed changes mid-lesson, re-speak the current sentence so
  // the new rate is heard immediately (the teleprompter otherwise only
  // picks up a new rate on the next sentence).
  useEffect(() => {
    if (tele.state === "playing" && tele.currentIdx >= 0) {
      tele.jumpTo(tele.currentIdx);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tele.rate]);

  // ── Present mode (show the lesson on the complete screen) ──────────
  //
  // Two ways the browser can go fullscreen:
  //   1. Our "Present" button → document.requestFullscreen(). Fires a
  //      `fullscreenchange` event we can listen for.
  //   2. The user's own F11 key → native browser/OS fullscreen. Chrome
  //      does NOT fire `fullscreenchange` for this (by design, so sites
  //      can't tell F11 was pressed), so `document.fullscreenElement`
  //      stays null. The only reliable signal is that the viewport now
  //      fills the whole physical screen — so we detect that via resize.
  //
  // Whichever way the browser entered fullscreen, present mode should
  // turn on and hide the header/sidebars/bottom-bar.
  function isBrowserFullscreen() {
    if (typeof document === "undefined") return false;
    if (document.fullscreenElement) return true;
    if (typeof window === "undefined" || !window.screen) return false;
    const tol = 4; // small tolerance for scrollbar/DPI rounding
    return (
      Math.abs(window.innerWidth - window.screen.width) <= tol &&
      Math.abs(window.innerHeight - window.screen.height) <= tol
    );
  }

  // Once the user explicitly hits "Exit" we don't want the resize-based
  // heuristic to immediately flip present mode back on (F11 fullscreen
  // can't be exited from JS, so the window stays screen-sized). This
  // suppresses auto-detection until the window actually leaves fullscreen
  // (e.g. the user presses F11 again), at which point it resets.
  const suppressAutoPresentRef = useRef(false);

  useEffect(() => {
    const sync = () => {
      const fs = isBrowserFullscreen();
      if (!fs) suppressAutoPresentRef.current = false;
      setPresentMode(fs && !suppressAutoPresentRef.current);
    };
    document.addEventListener("fullscreenchange", sync);
    window.addEventListener("resize", sync);
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      window.removeEventListener("resize", sync);
    };
  }, []);

  // Whenever present mode turns on — from the button, F11, or the
  // refresh-recovery flow below — collapse both side panels so the slide
  // gets the complete screen.
  useEffect(() => {
    if (presentMode) {
      setPresenterOpen(false);
      setLessonsOpen(false);
    }
  }, [presentMode]);

  function enterPresent() {
    suppressAutoPresentRef.current = false;
    setPresentMode(true);
    document.documentElement.requestFullscreen?.().catch(() => {});
    try { localStorage.setItem("pp_present", "1"); } catch { /* ignore */ }
  }
  function exitPresent() {
    suppressAutoPresentRef.current = true;
    setPresentMode(false);
    if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    try { localStorage.removeItem("pp_present"); } catch { /* ignore */ }
  }

  // Browsers block auto-fullscreen on load (F5) — it needs a user gesture.
  // So if the user was presenting before refreshing, re-enter present mode
  // on their very first tap / key press after the page reloads.
  useEffect(() => {
    let wanted = false;
    try { wanted = localStorage.getItem("pp_present") === "1"; } catch { /* ignore */ }
    if (!wanted) return;
    let done = false;
    const enter = () => {
      if (done) return;
      done = true;
      enterPresent();
      cleanup();
    };
    const cleanup = () => {
      window.removeEventListener("pointerdown", enter);
      window.removeEventListener("keydown", enter);
    };
    window.addEventListener("pointerdown", enter);
    window.addEventListener("keydown", enter);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    if (!target) return;
    cancelVerify(); // kill any pending question from the old slide
    setManualSlide(target.id);
    const startIdx = sectionStarts[target.id];
    if (startIdx >= 0) tele.jumpTo(startIdx);
  }
  function startSlide() {
    cancelVerify(); // a pending question belongs to the old position
    const startIdx = sectionStarts[activeSection.id];
    if (startIdx >= 0) tele.jumpTo(startIdx);
  }

  const progressPct = flat.length
    ? Math.round(((Math.max(tele.currentIdx, 0) + 1) / flat.length) * 100)
    : 0;
  const isSpeaking = tele.state === "playing";

  const toggleVoice = () =>
    voiceCmd.listening ? voiceCmd.stop() : voiceCmd.start();

  // Left-sidebar navigation — wired to the app's real dashboard routes so
  // it stays functional, styled after the PassPoint teacher sidebar.
  const navItems = [
    { name: "Home", Icon: HomeIcon, to: "/dashboard" },
    { name: "My Progress", Icon: ChartIcon, to: "/progress" },
    { name: "Badges", Icon: TrophyIcon, to: "/accomplishments" },
    { name: "Reports", Icon: BookmarkIcon, to: "/bookmarks" },
    { name: "Settings", Icon: SettingsIcon, to: "/settings" },
  ];

  const RADIUS = 26;
  const CIRC = 2 * Math.PI * RADIUS;

  // Fixed bar heights for the bottom control-bar audio visualiser.
  const WAVE_HEIGHTS = [
    6, 12, 18, 24, 16, 8, 14, 20, 28, 14, 8, 18, 24, 12, 6, 14, 22, 16, 8, 20,
    6, 12, 18, 24, 16, 8, 14, 20, 28, 14, 8, 18, 24, 12, 6, 14, 22, 16, 8, 20,
  ];

  // ─── Left teacher sidebar ──────────────────────────────────────────
  const sidebarContent = (
    <div className="flex flex-col h-full w-full">
      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-5 pr-1">
        {/* Tagline header */}
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.2em] font-black text-indigo-300 font-display">
            Your AI Teacher
          </div>
          <div className="flex items-center justify-center flex-wrap gap-1.5 mt-1.5">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-500 opacity-75 animate-ping" />
              <span className="relative inline-flex w-2 h-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-[11px] font-bold text-emerald-400">Live</span>
            <span className="text-[11px] text-gray-500">•</span>
            <span className="text-[11px] text-gray-400 font-semibold">
              {lesson.classLevel} · {subject.name}
            </span>
          </div>
        </div>

        {/* Avatar — glowing gradient ring + Live badge */}
        <div className="flex flex-col items-center">
          <div className="relative">
            {/* Soft outer glow (pulses while the teacher is speaking) */}
            <div
              className={[
                "absolute -inset-1.5 rounded-full bg-gradient-to-tr from-purple-600 via-pink-500 to-blue-500 blur-md pointer-events-none",
                isSpeaking ? "opacity-90 animate-pulse" : "opacity-60",
              ].join(" ")}
            />
            {/* Gradient ring */}
            <div className="relative w-28 h-28 rounded-full p-[3px] bg-gradient-to-tr from-purple-500 via-pink-500 to-sky-500 shadow-xl">
              <div className="w-full h-full rounded-full overflow-hidden bg-[#161233] border-2 border-[#0c0a21]">
                <img
                  src={TEACHER_AVATAR}
                  alt="Aunty Adesua"
                  className="w-full h-full object-cover"
                  style={{ objectPosition: "50% 16%" }}
                  draggable={false}
                />
              </div>
            </div>
            {/* Live badge */}
            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-emerald-500 text-white text-[10px] px-2.5 py-0.5 rounded-full font-bold border-2 border-[#0c0a21] shadow-lg flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Live</span>
            </div>
          </div>

          {/* Name + role */}
          <div className="text-center mt-4">
            <h2 className="text-white font-bold text-lg font-display flex items-center justify-center gap-1 leading-tight whitespace-nowrap">
              <span>Aunty Adesua</span>
              <span className="text-amber-400 text-base">✨</span>
            </h2>
            <p className="text-[11px] text-gray-400 font-semibold mt-0.5">
              AI Tutor
            </p>
          </div>
        </div>

        {/* Passport AI badge */}
        <div className="bg-[#1c183c]/60 border border-white/10 rounded-xl px-3 py-2 text-center shadow-inner">
          <span className="text-[11px] font-black text-indigo-100 tracking-wide font-display">
            Passport AI • Built for Africa
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = item.name === "Home";
            return (
              <button
                key={item.name}
                onClick={() => navigate(item.to)}
                className={[
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl transition duration-300 border group",
                  isActive
                    ? "bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border-purple-500/40 text-white font-bold shadow-lg shadow-purple-950/40"
                    : "text-gray-400 hover:text-white hover:bg-white/5 border-transparent hover:border-white/5 font-medium",
                ].join(" ")}
              >
                <item.Icon
                  className={[
                    "w-[18px] h-[18px] transition",
                    isActive ? "text-purple-300" : "text-gray-500 group-hover:text-purple-300",
                  ].join(" ")}
                />
                <span className="text-[13px]">{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Day-streak tracker */}
      <div className="mt-4 bg-gradient-to-br from-purple-900/20 to-indigo-950/30 border border-white/10 rounded-2xl p-3.5 flex items-center justify-between shadow-lg shrink-0">
        <div className="flex flex-col gap-0.5">
          <div className="flex items-center gap-1.5">
            <span className="text-[22px] font-extrabold text-amber-400 font-display leading-none">7</span>
            <span className="text-[12px] font-bold text-gray-200 leading-none">Day Streak</span>
          </div>
          <p className="text-[10px] text-gray-400">Keep it up! 🔥</p>
        </div>
        <div className="relative">
          <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-sm scale-110" />
          <div className="relative bg-[#292257]/80 p-2 rounded-xl border border-yellow-500/30">
            <StarIcon className="w-6 h-6 text-yellow-500" fill="#facc15" />
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Right lesson-plan panel ───────────────────────────────────────
  const lessonPlanContent = (
    <div className="flex flex-col h-full w-full">
      <h3 className="text-[11px] font-black tracking-widest text-indigo-300 font-display mb-3 shrink-0">
        LESSON PLAN
      </h3>

      <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-1.5 pr-1">
        {sections.map((s, i) => {
          const isActive = i === activeSlideIdx;
          const isDone = i < activeSlideIdx;
          const v = s.visual || {};
          const img = v.type === "kg-letter" ? letterImage(v.letter) : null;
          const fallback = v.type === "kg-letter" ? v.letter : v.icon || v.emoji || "★";
          return (
            <button
              key={s.id}
              onClick={() => {
                goToSlide(i);
                if (typeof window !== "undefined" && window.innerWidth < 1280)
                  setLessonsOpen(false);
              }}
              className={[
                "rounded-xl p-1.5 flex items-center justify-between cursor-pointer border transition duration-300 group text-left",
                isActive
                  ? "bg-gradient-to-tr from-purple-600/25 to-indigo-600/25 border-purple-500/50 shadow-md shadow-purple-950/50"
                  : "bg-[#110e2d]/40 border-white/5 hover:border-purple-500/30 hover:bg-[#1a153f]/40",
              ].join(" ")}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-lg overflow-hidden bg-gradient-to-tr from-purple-700 to-indigo-600 flex items-center justify-center text-white text-sm font-black font-display shrink-0 border border-white/10 relative">
                  {img ? (
                    <img
                      src={img}
                      alt={s.heading}
                      className="w-full h-full object-cover"
                      draggable={false}
                    />
                  ) : (
                    <span>{fallback}</span>
                  )}
                  {/* Little letter chip on photo thumbnails */}
                  {img && (
                    <span className="absolute top-0 left-0 bg-black/70 rounded-br-md w-3.5 h-3.5 flex items-center justify-center text-[8px] font-black text-pink-300 font-display">
                      {v.letter}
                    </span>
                  )}
                </div>
                <div className="flex flex-col min-w-0">
                  <h4 className="text-white text-[11px] font-bold font-display truncate leading-tight group-hover:text-purple-300 transition">
                    {s.heading}
                  </h4>
                  <span className="text-[9px] text-gray-400 font-mono leading-tight">
                    {i + 1} / {sections.length}
                  </span>
                </div>
              </div>
              <div className="shrink-0 ml-2">
                {isActive ? (
                  <div className="w-4 h-4 rounded-full bg-sky-500 flex items-center justify-center text-white border border-sky-400">
                    <CheckIcon className="w-2.5 h-2.5" />
                  </div>
                ) : isDone ? (
                  <div className="w-4 h-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                    <CheckIcon className="w-2.5 h-2.5" />
                  </div>
                ) : (
                  <div className="w-4 h-4 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 border border-indigo-500/30 text-[8px]">
                    ▶
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <button
        onClick={() => navigate("/subjects")}
        className="mt-3 w-full flex items-center justify-between text-[11px] font-bold text-gray-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-3 py-2.5 transition shrink-0"
      >
        <span>View All Lessons</span>
        <ArrowRightIcon className="w-3.5 h-3.5" />
      </button>

      {/* Today's progress radial */}
      <div className="mt-3 bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-3 shadow-xl shrink-0">
        <h4 className="text-[10px] font-bold text-gray-400 tracking-wider font-display uppercase">
          Today's Progress
        </h4>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle cx="32" cy="32" r={RADIUS} className="stroke-[#151131] fill-none" strokeWidth="5" />
              <circle
                cx="32"
                cy="32"
                r={RADIUS}
                className="stroke-cyan-400 fill-none"
                strokeWidth="5.5"
                strokeDasharray={CIRC}
                strokeDashoffset={CIRC * (1 - progressPct / 100)}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute font-bold text-sm text-white font-mono leading-none">
              {progressPct}%
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <h5 className="text-white font-bold text-[13px] flex items-center gap-1 font-display">
              <span>Great job!</span>
              <span className="text-amber-400">⭐</span>
            </h5>
            <p className="text-xs text-gray-400">
              <span className="text-white font-bold font-mono">
                {Math.max(activeSlideIdx + 1, 1)}
              </span>{" "}
              / {sections.length} slides
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-[#070518] text-gray-200 antialiased flex flex-col overflow-hidden select-none">
      {/* Premium ambient glows in the background */}
      <div className="absolute top-[-20%] left-[-10%] w-[55%] h-[55%] bg-indigo-600/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[55%] h-[55%] bg-purple-600/10 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* Subtle dot pattern overlay for depth */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* Top bar — hidden in present mode */}
      {!presentMode && (
      <div className="relative z-10 h-14 flex items-center justify-between px-3 sm:px-5 bg-[#0c0a21]/80 backdrop-blur-lg border-b border-[#1e1a3d] shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            onClick={() => navigate("/subjects")}
            className="flex items-center gap-1.5 sm:gap-2 text-xs font-extrabold text-gray-400 hover:text-white transition active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#151235]/40 border border-purple-500/10 hover:border-purple-500/20 shrink-0"
            title="Exit presentation"
          >
            <CloseIcon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          {/* Menu — toggles the left teacher sidebar */}
          <button
            onClick={() => setPresenterOpen((o) => !o)}
            className={[
              "flex items-center gap-1.5 text-xs font-bold transition active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-lg border shrink-0",
              presenterOpen
                ? "bg-purple-600/30 border-purple-500/50 text-white"
                : "bg-[#151235]/40 border-purple-500/10 text-gray-400 hover:text-white hover:border-purple-500/20",
            ].join(" ")}
            title="Toggle teacher menu"
          >
            <MenuIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Menu</span>
          </button>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 bg-[#120f2e]/70 border border-purple-500/10 py-1 px-3 sm:px-4 rounded-full shadow-inner min-w-0">
          <span className="text-[11px] sm:text-xs font-bold text-gray-100 font-display truncate">
            {subject.name}
          </span>
          <span className="text-purple-500 text-xs font-black animate-pulse shrink-0">
            •
          </span>
          <span className="text-[11px] sm:text-xs font-semibold text-gray-400 truncate">
            {topic.title}
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Mic toggle pill */}
          {voiceCmd.supported && (
            <button
              onClick={toggleVoice}
              className={[
                "flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold transition active:scale-95 border",
                voiceCmd.listening
                  ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
                  : "bg-red-500/15 text-red-400 border-red-500/30",
              ].join(" ")}
              title={voiceCmd.listening ? "Turn mic off" : "Turn mic on"}
            >
              <MicIcon className={`w-3 h-3 ${voiceCmd.listening ? "animate-pulse" : ""}`} />
              <span className="hidden md:inline">
                {voiceCmd.listening ? "Mic ON" : "Mic OFF"}
              </span>
            </button>
          )}

          {/* Progress gauge */}
          <div className="hidden sm:flex items-center gap-2 sm:gap-3 bg-[#151235]/40 px-3 py-1 rounded-xl border border-purple-500/10">
            <span className="hidden lg:inline text-[10px] font-bold text-gray-400 font-display uppercase tracking-wider">
              Progress
            </span>
            <div className="relative w-16 lg:w-28 h-2 bg-[#151131] rounded-full overflow-hidden border border-purple-500/10">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-500 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-[11px] font-black text-emerald-400 tabular-nums">
              {progressPct}%
            </span>
          </div>

          {/* Present — clean full-screen slide view */}
          <button
            onClick={enterPresent}
            className="flex items-center gap-1.5 text-xs font-bold transition active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-lg border shrink-0 bg-[#151235]/40 border-purple-500/10 text-gray-400 hover:text-white hover:border-purple-500/20"
            title="Present on full screen"
          >
            <ExpandIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden md:inline">Present</span>
          </button>

          {/* Lessons — toggles the right lesson-plan panel */}
          <button
            onClick={() => setLessonsOpen((o) => !o)}
            className={[
              "flex items-center gap-1.5 text-xs font-bold transition active:scale-95 px-2.5 sm:px-3 py-1.5 rounded-lg border shrink-0",
              lessonsOpen
                ? "bg-purple-600/30 border-purple-500/50 text-white"
                : "bg-[#151235]/40 border-purple-500/10 text-gray-400 hover:text-white hover:border-purple-500/20",
            ].join(" ")}
            title="Toggle lesson plan"
          >
            <BookIcon className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">Lessons</span>
          </button>
        </div>
      </div>
      )}

      {/* Main stage */}
      <div
        className={[
          "relative z-10 flex-1 min-h-0 flex overflow-hidden",
          presentMode
            ? "gap-0 p-0"
            : "gap-3 sm:gap-4 lg:gap-5 px-3 sm:px-4 lg:px-6 py-3 sm:py-4 lg:py-5",
        ].join(" ")}
      >
        {/* Tap-outside backdrops when a panel is open as an overlay */}
        {presenterOpen && (
          <div
            className="lg:hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setPresenterOpen(false)}
          />
        )}
        {lessonsOpen && (
          <div
            className="xl:hidden absolute inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={() => setLessonsOpen(false)}
          />
        )}

        {/* Left teacher sidebar — collapsible (in-flow on desktop, overlay on mobile) */}
        <div
          className={[
            "transition-all duration-300 h-full shrink-0 z-50 overflow-hidden lg:relative absolute left-0 top-0 bottom-0",
            presenterOpen ? "w-64" : "w-0",
          ].join(" ")}
        >
          <aside className="h-full w-64 flex flex-col bg-[#0c0a21]/80 lg:bg-[#0c0a21]/60 backdrop-blur-xl rounded-3xl shadow-2xl p-4 border border-white/10">
            {sidebarContent}
          </aside>
        </div>

        {/* Center: stage + mode tabs */}
        <div className="relative flex-1 min-w-0 flex flex-col">
          {/* Mobile-only mini avatar header — hidden in present mode */}
          {!presentMode && (
          <div className="lg:hidden bg-[#0c0a21]/70 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-2.5 mb-3 flex items-center gap-3">
            <TalkingAvatar speaking={isSpeaking} size="sm" />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] uppercase tracking-wide text-indigo-300 font-bold">
                {subject.presenterName || "AI Tutor"}
              </div>
              <div className="text-xs text-gray-300 truncate">
                {isSpeaking
                  ? "Speaking…"
                  : tele.state === "paused"
                    ? "Paused"
                    : "Ready"}
              </div>
            </div>
            <button
              onClick={() => setPresenterOpen(true)}
              className="text-xs text-purple-300 font-semibold px-2 py-1 rounded-md hover:bg-white/5"
            >
              Open
            </button>
          </div>
          )}

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
                speaking={isSpeaking}
                onPrevSlide={() => goToSlide(activeSlideIdx - 1)}
                onNextSlide={() => goToSlide(activeSlideIdx + 1)}
                canPrev={activeSlideIdx > 0}
                canNext={activeSlideIdx < sections.length - 1}
                onSentenceClick={(globalIdx) => {
                  tele.jumpTo(globalIdx);
                  enterPresent();
                }}
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
                speaking={isSpeaking}
                onPrevSlide={() => goToSlide(activeSlideIdx - 1)}
                onNextSlide={() => goToSlide(activeSlideIdx + 1)}
                canPrev={activeSlideIdx > 0}
                canNext={activeSlideIdx < sections.length - 1}
                onSentenceClick={(globalIdx) => {
                  tele.jumpTo(globalIdx);
                  enterPresent();
                }}
              />
            )}
          </div>

          {/* Inline AI reply bubble — bottom of stage, kindergarten only.
              Lives inside the stage column (not the full-screen root) so
              it centers over the slide itself, not the whole app width —
              otherwise it drifts off-center whenever a side panel is open. */}
          {isKindergarten && aiReply && (
            <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-sm px-4 pointer-events-none">
              <div className="bg-white shadow-2xl rounded-2xl px-4 py-2.5 border border-rose-100 animate-[fadeIn_0.25s_ease-out]">
                <div className="text-[9px] uppercase tracking-wider font-bold text-rose-500 mb-0.5">
                  Aunty Adesua
                </div>
                <div className="text-xs sm:text-sm text-ink-900 leading-snug whitespace-pre-wrap">
                  {aiReply}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right lesson-plan panel — collapsible (in-flow on xl, overlay below) */}
        <div
          className={[
            "transition-all duration-300 h-full shrink-0 z-50 overflow-hidden xl:relative absolute right-0 top-0 bottom-0",
            lessonsOpen ? "w-72" : "w-0",
          ].join(" ")}
        >
          <aside className="h-full w-72 flex flex-col bg-[#0c0a21]/80 xl:bg-[#0c0a21]/60 backdrop-blur-xl rounded-3xl shadow-2xl p-4 border border-white/10">
            {lessonPlanContent}
          </aside>
        </div>
      </div>

      {/* Verify mini-game prompt — only shows when the child is asked to
          repeat a word (kept off the speech bubble at top-center). */}
      {isKindergarten && voiceCmd.supported && verifyTarget && (
        <div className="absolute bottom-[9.5rem] sm:bottom-44 left-1/2 -translate-x-1/2 z-30 pointer-events-none max-w-[92vw]">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider shadow-lg backdrop-blur border bg-amber-400/95 text-ink-900 border-amber-300/50">
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            {`Your turn! Say "${verifyTarget}" (${verifyAttempt}/${MAX_VERIFY_ATTEMPTS})`}
          </div>
        </div>
      )}

      {/* Floating control bar — hidden in present mode */}
      {!presentMode && (
      <div className="relative z-20 px-3 sm:px-4 lg:px-8 pb-3 sm:pb-4">
        <div className="bg-[#0c0a21]/80 backdrop-blur-xl shadow-[0_-10px_30px_rgba(0,0,0,0.5)] border border-white/10 rounded-2xl p-2 flex items-center gap-2 sm:gap-3 overflow-x-auto">
          {/* Play / pause — starting playback also takes the lesson fullscreen */}
          <button
            onClick={() => {
              if (isSpeaking) {
                tele.pause();
              } else {
                tele.play();
                enterPresent();
              }
            }}
            disabled={!tele.supported}
            className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            title={
              isSpeaking
                ? "Pause"
                : tele.state === "paused"
                  ? "Resume"
                  : "Start lesson"
            }
          >
            {isSpeaking ? (
              <PauseIcon className="w-4 h-4" />
            ) : (
              <PlayIcon className="w-4 h-4 ml-0.5" />
            )}
          </button>

          {/* Stop — resets to the start (only when something is playing/paused) */}
          {tele.state !== "idle" && (
            <button
              onClick={tele.stop}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white flex items-center justify-center border border-white/10 active:scale-95 transition shrink-0"
              title="Stop"
            >
              <StopIcon className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Speed capsule — changes apply immediately, even mid-lesson */}
          {tele.supported && (
            <div className="flex items-center gap-1 sm:gap-2 bg-white/5 border border-white/10 rounded-full p-1 sm:px-3 sm:py-1.5 shrink-0">
              <span className="text-[10px] font-bold text-gray-400 hidden xs:inline ml-1">
                Speed
              </span>
              <div className="flex items-center gap-0.5 sm:gap-1">
                {[0.85, 1, 1.25].map((r) => (
                  <button
                    key={r}
                    onClick={() => tele.setRate(r)}
                    className={`text-[9px] sm:text-[10px] font-bold px-2 sm:px-2.5 py-1 rounded-full transition ${tele.rate === r
                        ? "bg-purple-600 text-white shadow-md"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                  >
                    {r}×
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Center scrolling audio waveform */}
          <div className="hidden md:flex flex-1 items-center justify-center overflow-hidden h-10 mx-2 min-w-0">
            <div className="w-full flex items-center justify-between gap-1 h-10 opacity-90">
              {WAVE_HEIGHTS.map((h, i) => (
                <span
                  key={i}
                  style={{
                    height: isSpeaking ? `${h}px` : "4px",
                    animationDuration: isSpeaking ? `${1 + (i % 5) * 0.3}s` : undefined,
                    animationDelay: isSpeaking ? `${(i % 8) * 0.2}s` : undefined,
                  }}
                  className={[
                    "w-1 rounded-full transition-all duration-300",
                    isSpeaking ? "sound-bar" : "",
                    i % 4 === 0
                      ? "bg-gradient-to-t from-purple-500 to-indigo-400"
                      : i % 3 === 0
                        ? "bg-gradient-to-t from-pink-500 to-rose-400"
                        : "bg-gradient-to-t from-cyan-400 to-blue-400",
                  ].join(" ")}
                />
              ))}
            </div>
          </div>

          {/* Mobile: compact slide counter (fills the gap on small screens) */}
          <div className="md:hidden flex-1 text-center text-xs font-semibold text-gray-300 tabular-nums">
            {activeSlideIdx + 1} / {sections.length}
          </div>

          {/* Read current slide */}
          <button
            onClick={startSlide}
            className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold active:scale-95 transition shrink-0"
            title="Have the AI read this slide"
          >
            <BookIcon className="w-4 h-4 text-purple-400" />
            <span className="hidden sm:inline">Read</span>
          </button>

          {/* Ask AI */}
          <button
            onClick={openAskAI}
            className="relative overflow-hidden flex items-center gap-1.5 sm:gap-2 text-white text-xs sm:text-sm font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-full shadow-xl hover:scale-105 active:scale-95 transition-all shrink-0"
            title="Pause and ask a question"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
            <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-blue-400 to-pink-500 opacity-30 blur-sm" />
            <span className="relative flex items-center gap-1.5 sm:gap-2">
              <MicIcon className="w-4 h-4 animate-pulse" />
              <span className="hidden sm:inline">Ask AI</span>
            </span>
          </button>
        </div>
      </div>
      )}

      {/* Present-mode floating mini controls — tucked in a corner so they
          never compete with the slide's own caption bar, nav arrows, and
          slide counter (all already rendered inside the stage itself).
          Auto-dim, hover to focus. */}
      {presentMode && (
        <div className="absolute bottom-4 left-4 z-40 flex items-center gap-1.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl opacity-60 hover:opacity-100 transition-opacity">
          <button
            onClick={isSpeaking ? tele.pause : tele.play}
            disabled={!tele.supported}
            className="w-9 h-9 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:brightness-110 active:scale-95 disabled:opacity-50 shrink-0"
            title={isSpeaking ? "Pause" : "Play"}
          >
            {isSpeaking ? <PauseIcon className="w-3.5 h-3.5" /> : <PlayIcon className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          {/* Mini voice waveform — same speaking indicator as the main
              control bar, shrunk to fit this compact corner pill. */}
          <div className="hidden xs:flex items-center gap-0.5 h-9 px-1">
            {WAVE_HEIGHTS.slice(0, 12).map((h, i) => (
              <span
                key={i}
                style={{
                  height: isSpeaking ? `${Math.min(h, 18)}px` : "3px",
                  animationDuration: isSpeaking ? `${1 + (i % 5) * 0.3}s` : undefined,
                  animationDelay: isSpeaking ? `${(i % 8) * 0.2}s` : undefined,
                }}
                className={[
                  "w-0.5 rounded-full transition-all duration-300",
                  isSpeaking ? "sound-bar" : "",
                  i % 4 === 0
                    ? "bg-purple-400"
                    : i % 3 === 0
                      ? "bg-pink-400"
                      : "bg-cyan-400",
                ].join(" ")}
              />
            ))}
          </div>
        </div>
      )}

      {presentMode && (
        <div className="absolute bottom-4 right-4 z-40 flex items-center gap-1.5 bg-black/50 backdrop-blur-xl border border-white/10 rounded-full px-2 py-2 shadow-2xl opacity-60 hover:opacity-100 transition-opacity">
          <button
            onClick={exitPresent}
            className="flex items-center gap-1.5 text-xs font-bold text-gray-200 hover:text-white bg-white/10 hover:bg-white/20 rounded-full px-3 py-2 transition shrink-0"
            title="Exit present mode (Esc)"
          >
            <MinimizeIcon className="w-4 h-4" />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      )}

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
