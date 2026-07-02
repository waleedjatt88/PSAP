import { useEffect, useMemo, useRef, useState } from "react";
import { CloseIcon, MicIcon } from "./icons";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

export default function AskAIModal({
  open,
  lesson,
  resumeContext,
  onClose,
  classLevel = "JSS 1",
  preferredGender = "any",
  presenterName = "AI Tutor",
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);

  // Pick a voice that matches the subject's preferred gender so the
  // teacher in the chat sounds like the teacher in the lesson.
  const pickVoice = useMemo(
    () => () => {
      if (!("speechSynthesis" in window)) return null;
      const voices = window.speechSynthesis.getVoices();
      if (!voices.length) return null;
      const female =
        /female|ezinne|aria|jenny|libby|sonia|maisie|hazel|samantha|zira|salma|natasha/i;
      const male =
        /male|abeo|guy|davis|david|ryan|james|brian|mark|tony|george|daniel/i;
      const matches = (v) => {
        if (preferredGender === "female")
          return female.test(v.name) && !/male/i.test(v.name.replace(/female/i, ""));
        if (preferredGender === "male")
          return male.test(v.name) && !female.test(v.name);
        return true;
      };
      const inTier = (re) => {
        const tier = voices.filter((v) => re.test(v.lang));
        return tier.find(matches) || (preferredGender === "any" ? tier[0] : null);
      };
      return (
        inTier(/en[-_]?NG/i) ||
        inTier(/en[-_]?(ZA|KE|GH)/i) ||
        inTier(/en[-_]?GB/i) ||
        inTier(/en[-_]?US/i) ||
        inTier(/^en/i) ||
        voices[0]
      );
    },
    [preferredGender],
  );

  // Voice-to-text for the student's question. Auto-sends on final result
  // (after trimming junk).
  const speechRec = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (finalText) => {
      send(finalText);
    },
  });

  // Welcome message + reset chat whenever the modal opens fresh.
  useEffect(() => {
    if (open) {
      const initialGreeting = buildGreeting(presenterName, lesson, resumeContext);
      setMessages([{ role: "assistant", content: initialGreeting, isGreeting: true }]);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 80);
      // For kindergarten: speak the greeting AND start the mic immediately
      // so the child can just talk — no buttons between turns.
      if (classLevel === "Kindergarten") {
        setTimeout(() => speakAnswer(initialGreeting), 200);
      }
    } else {
      speechRec.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Mirror live transcription into the input box so the user sees what
  // the AI is hearing before sending.
  useEffect(() => {
    if (speechRec.listening && speechRec.transcript) {
      setInput(speechRec.transcript);
    }
  }, [speechRec.transcript, speechRec.listening]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

  // Lesson-aware suggestion chips. MUST be declared above the early
  // return below — React hooks have to run in the same order every render.
  const suggestions = useMemo(
    () => [
      "Can you explain that again, simpler?",
      "Can you give me an example?",
      `Why is this important?`,
      `Quiz me on ${lesson?.topic || "this"}`,
    ],
    [lesson?.topic],
  );

  if (!open) return null;

  function handleClose() {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    onClose?.();
  }

  function speakAnswer(text) {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    u.rate = 1;
    u.pitch = preferredGender === "female" ? 1.1 : 0.95;
    const v = pickVoice();
    if (v) u.voice = v;
    // For kindergarten (ages 3-7) we want a real back-and-forth: after
    // the teacher finishes speaking, auto-restart the mic so the child
    // can just talk. They never tap a button between turns. Older
    // students keep the manual mic flow (they're often in quiet rooms).
    if (classLevel === "Kindergarten" && speechRec.supported) {
      u.onend = () => {
        // Tiny pause so the synthesis tail doesn't get picked up as input.
        setTimeout(() => {
          // Only restart if the modal is still open and we're not already
          // sending — guards against ghost mic sessions after Close.
          if (!sending) speechRec.start();
        }, 350);
      };
    }
    window.speechSynthesis.speak(u);
  }

  // Validate input. Voice recognition occasionally returns just
  // punctuation ("::", ".", " ") when audio is unclear — those we reject.
  // BUT we must still accept short answers like "9", "B", "yes" because
  // those are valid replies to quiz questions. So the rule is: at least
  // one word character (letter or digit).
  function isJunk(text) {
    if (!text) return true;
    return !/\w/.test(text);
  }

  async function send(content) {
    const text = (content ?? input).trim();
    if (sending) return;
    if (isJunk(text)) {
      // Don't bother the AI with garbage — show a hint instead.
      setInput("");
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content:
            "I didn't quite catch that — could you say it again, or type your question?",
          isHint: true,
        },
      ]);
      return;
    }
    setInput("");
    const next = [
      // Strip greeting/hint messages from history so the AI sees only the
      // real conversation.
      ...messages.filter((m) => !m.isGreeting && !m.isHint),
      { role: "user", content: text },
    ];
    setMessages((m) => [...m, { role: "user", content: text }]);
    setSending(true);
    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          context: {
            classLevel,
            subject: lesson?.subjectName,
            topic: lesson?.topic,
            lessonContent: lessonToText(lesson),
          },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Chat failed");
      const reply = data.reply || "(no reply)";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      speakAnswer(reply);
    } catch (err) {
      const raw = String(err?.message || err);
      let friendly =
        "Sorry, I couldn't reach the AI right now. Please try again in a moment.";
      if (/invalid_api_key|Incorrect API key/i.test(raw)) {
        friendly =
          "⚠️ The AI provider key is invalid or expired. Update it in your .env / Vercel env vars and redeploy.";
      } else if (/rate_limit|rate-limit/i.test(raw)) {
        friendly = "⚠️ AI is rate-limited. Wait a few seconds and try again.";
      } else if (/missing/i.test(raw)) {
        friendly = "⚠️ AI key missing on the server.";
      }
      setMessages((m) => [...m, { role: "assistant", content: friendly }]);
      console.error("[ask-ai]", raw);
    } finally {
      setSending(false);
    }
  }

  // Empty-state aware label for the "paused on" indicator.
  const pausedLabel =
    resumeContext?.sectionHeading && resumeContext.sectionHeading !== "—"
      ? `Lesson paused on: ${resumeContext.sectionHeading}`
      : "Lesson hasn't started yet";

  // Hide the greeting + hint messages from the chat history once a real
  // exchange has begun, so the conversation stays clean.
  const hasRealExchange = messages.some((m) => m.role === "user");
  const visibleMessages = hasRealExchange
    ? messages.filter((m) => !m.isGreeting && !m.isHint)
    : messages;

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] animate-[fadeIn_0.2s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-ink-100 flex items-center gap-3 bg-gradient-to-r from-blue-50/50 to-orange-50/50">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-200 to-orange-200 flex items-center justify-center text-xl shrink-0 ring-2 ring-white shadow-card">
            👩‍🏫
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink-900 text-sm truncate">
              {presenterName}
            </div>
            <div className="text-[11px] text-ink-500 truncate flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {pausedLabel}
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-500 shrink-0"
            title="Close and resume lesson"
            aria-label="Close and resume lesson"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Quoted excerpt — only when there's actually a paused sentence */}
        {resumeContext?.sentence && hasRealExchange === false && (
          <div className="px-5 pt-3">
            <div className="text-[10px] uppercase tracking-wider text-ink-500 mb-1 font-semibold">
              You paused on
            </div>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 text-xs text-ink-700 italic">
              "{resumeContext.sentence}"
            </div>
          </div>
        )}

        {/* Suggestion chips — only before first user message */}
        {!hasRealExchange && (
          <div className="px-5 pt-3 flex flex-wrap gap-1.5">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-[11px] bg-ink-100 hover:bg-brand-blue hover:text-white text-ink-700 rounded-full px-2.5 py-1 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Chat scroll area */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-3 min-h-[10rem]"
        >
          {visibleMessages.map((m, i) => (
            <ChatBubble key={i} role={m.role} content={m.content} presenterName={presenterName} />
          ))}
          {sending && (
            <ChatBubble role="assistant" presenterName={presenterName}>
              <span className="inline-flex items-center gap-1">
                <Dot /> <Dot delay={150} /> <Dot delay={300} />
              </span>
            </ChatBubble>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-3 border-t border-ink-100 flex gap-2 items-center"
        >
          <button
            type="button"
            onClick={() =>
              speechRec.listening ? speechRec.stop() : speechRec.start()
            }
            disabled={!speechRec.supported || sending}
            title={
              !speechRec.supported
                ? "Voice input not supported in this browser"
                : speechRec.listening
                  ? "Stop listening"
                  : "Speak your question"
            }
            className={[
              "shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors",
              speechRec.listening
                ? "bg-red-500 text-white animate-pulse"
                : "bg-ink-100 text-ink-700 hover:bg-brand-blue hover:text-white",
              !speechRec.supported && "opacity-40 cursor-not-allowed",
            ]
              .filter(Boolean)
              .join(" ")}
          >
            <MicIcon className="w-5 h-5" />
          </button>

          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              speechRec.listening
                ? "Listening…"
                : "Type or tap the mic to speak"
            }
            className="flex-1 min-w-0 text-sm bg-ink-100/60 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
          <button
            type="submit"
            disabled={sending || isJunk(input)}
            className="shrink-0 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2.5 rounded-full disabled:opacity-50"
          >
            Send
          </button>
        </form>

        {/* Footer */}
        <div className="px-5 py-2 border-t border-ink-100 text-[11px] text-ink-500 flex items-center justify-between gap-2">
          <span className="flex items-center gap-1 min-w-0 truncate">
            <MicIcon className="w-3 h-3 shrink-0" />{" "}
            <span className="truncate">
              {speechRec.supported
                ? "Speak or type — AI replies with voice"
                : "AI will speak its answer"}
            </span>
          </span>
          <button
            onClick={handleClose}
            className="text-brand-blue font-semibold hover:underline shrink-0"
          >
            Resume lesson →
          </button>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({ role, content, presenterName, children }) {
  if (role === "user") {
    return (
      <div className="flex justify-end animate-[fadeIn_0.25s_ease-out]">
        <div className="bg-brand-blue text-white rounded-2xl rounded-tr-sm px-4 py-2.5 max-w-[85%] text-sm leading-relaxed whitespace-pre-wrap shadow-card">
          {content}
        </div>
      </div>
    );
  }
  // Assistant
  const shortName = (presenterName || "AI Tutor").split("·")[0].trim();
  return (
    <div className="flex items-start gap-2 animate-[fadeIn_0.25s_ease-out]">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-200 to-orange-200 flex items-center justify-center text-base shrink-0 ring-2 ring-white shadow-card">
        👩‍🏫
      </div>
      <div className="flex flex-col items-start max-w-[85%]">
        <div className="text-[10px] text-ink-500 font-semibold mb-0.5 ml-1">
          {shortName}
        </div>
        <div className="bg-ink-100 text-ink-900 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap">
          {children || content}
        </div>
      </div>
    </div>
  );
}

function Dot({ delay = 0 }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-ink-500 inline-block animate-bounce"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}

function buildGreeting(presenterName, lesson, resumeContext) {
  const shortName = (presenterName || "AI Tutor").split("·")[0].trim();
  const topic = lesson?.topic || "today's lesson";
  if (resumeContext?.sectionHeading) {
    return `Hi! 👋 I'm ${shortName}. We're on "${resumeContext.sectionHeading}" — what would you like me to explain about ${topic}? You can type or tap the microphone to speak.`;
  }
  return `Hi! 👋 I'm ${shortName}. What would you like to ask about ${topic}? You can type your question or tap the microphone to speak.`;
}

// Locally serialize the lesson — sent as the AI's only knowledge source.
// We include not just the spoken sections but also the official quiz bank
// (Quick Quiz / MCQs / Theory / Assignment) so the AI can use the EXACT
// questions from the lesson notes when the student asks to be quizzed.
function lessonToText(lesson) {
  if (!lesson?.sections) return "";
  const parts = lesson.sections.map(
    (s) => `## ${s.heading}\n${(s.sentences || []).join(" ")}`,
  );

  if (lesson.quiz) {
    const { quickQuiz, mcqs, theory, assignment } = lesson.quiz;
    const quizBlock = ["", "# OFFICIAL QUIZ BANK (use these EXACT questions when student asks)"];

    if (quickQuiz?.length) {
      quizBlock.push("\n## Quick Quiz");
      quickQuiz.forEach((q, i) => {
        quizBlock.push(`${i + 1}. ${q.q}  [${q.marks} marks]`);
        if (q.a) quizBlock.push(`   Answer: ${q.a}`);
      });
    }

    if (mcqs?.length) {
      quizBlock.push("\n## Multiple Choice Questions (MCQs)");
      mcqs.forEach((m, i) => {
        quizBlock.push(`${i + 1}. ${m.q}  [${m.marks} marks]`);
        Object.entries(m.options).forEach(([key, val]) =>
          quizBlock.push(`   ${key}. ${val}`),
        );
        quizBlock.push(`   Correct answer: ${m.answer}`);
      });
    }

    if (theory?.length) {
      quizBlock.push("\n## Theory Questions");
      theory.forEach((t, i) =>
        quizBlock.push(`${i + 1}. ${t.q}  [${t.marks} marks]`),
      );
    }

    if (assignment?.length) {
      quizBlock.push("\n## Assignment (Take Home)");
      assignment.forEach((a, i) =>
        quizBlock.push(`${i + 1}. ${a.q}  [${a.marks} marks]`),
      );
    }

    parts.push(quizBlock.join("\n"));
  }

  return parts.join("\n\n");
}
