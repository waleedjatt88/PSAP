import { useEffect, useRef, useState } from "react";
import { CloseIcon, MicIcon } from "./icons";
import useSpeechRecognition from "../hooks/useSpeechRecognition";

// Modal overlay that pops up when the student wants to ask a question
// mid-lesson. Triggers the parent to pause the teleprompter on open,
// and to resume on close.
//
// Props:
// - open: boolean
// - lesson: the full lesson object (used to lock the AI to this content)
// - resumeContext: { sectionHeading, sentence } — what was being read
//   when the student interrupted. Shown so the student remembers context.
// - onClose: () => void  (parent resumes the lesson)
// - classLevel
export default function AskAIModal({
  open,
  lesson,
  resumeContext,
  onClose,
  classLevel = "JSS 1",
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const lastAnswerVoiceRef = useRef(null);

  // Voice-to-text for the student's question. When the user releases
  // (final result), we either auto-send or fill the input box.
  const speechRec = useSpeechRecognition({
    continuous: false,
    interimResults: true,
    onResult: (finalText) => {
      // Auto-send the question once recognized.
      send(finalText);
    },
  });

  // Reset chat whenever the modal opens fresh, and focus the input.
  useEffect(() => {
    if (open) {
      setMessages([]);
      setInput("");
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      // Stop voice recognition + any AI-spoken answer when the modal closes.
      speechRec.abort();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Mirror live transcription into the input box so the user can see
  // what the AI is hearing before sending.
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

  if (!open) return null;

  // Stop any AI-spoken answer and close the modal — parent resumes the lesson.
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
    u.pitch = 1.05;
    lastAnswerVoiceRef.current = u;
    window.speechSynthesis.speak(u);
  }

  async function send(content) {
    const text = (content ?? input).trim();
    if (!text || sending) return;
    setInput("");
    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
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
            // Send the entire lesson as the AI's only knowledge source.
            lessonContent: lessonToText(lesson),
          },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Chat failed");
      const reply = data.reply || "(no reply)";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
      // AI speaks its answer too — both text and voice, as spec'd.
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

  const suggestions = [
    "Explain that again, simpler",
    "Can you give me an example?",
    "Why is that important?",
    "Quiz me on this",
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-ink-900/40 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-[fadeIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3 border-b border-ink-100 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center text-lg">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-ink-900 text-sm">
              Ask the AI Tutor
            </div>
            <div className="text-[11px] text-ink-500 truncate">
              Lesson paused on:{" "}
              <span className="font-medium">
                {resumeContext?.sectionHeading || "—"}
              </span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-9 h-9 rounded-full hover:bg-ink-100 flex items-center justify-center text-ink-500"
            title="Close and resume lesson"
            aria-label="Close and resume lesson"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Quoted excerpt the student was hearing when they interrupted */}
        {resumeContext?.sentence && (
          <div className="px-5 pt-3">
            <div className="text-[11px] uppercase tracking-wide text-ink-500 mb-1">
              You interrupted here
            </div>
            <div className="bg-ink-100/60 rounded-lg p-3 text-xs text-ink-700 italic">
              "{resumeContext.sentence}"
            </div>
          </div>
        )}

        {/* Suggestion chips (only before first message) */}
        {messages.length === 0 && (
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
          className="flex-1 overflow-y-auto px-5 py-4 space-y-3 min-h-[8rem]"
        >
          {messages.length === 0 && !sending && (
            <div className="text-xs text-ink-500 text-center py-6">
              Ask me anything about <strong>{lesson?.topic}</strong>. I'll
              answer using only what's in today's lesson.
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`text-sm leading-relaxed rounded-2xl p-3 max-w-[85%] whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-brand-blue text-white ml-auto"
                  : "bg-ink-100 text-ink-900"
              }`}
            >
              {m.content}
            </div>
          ))}
          {sending && (
            <div className="text-xs bg-ink-100 rounded-2xl p-3 inline-flex items-center gap-1">
              <Dot /> <Dot delay={150} /> <Dot delay={300} />
            </div>
          )}
        </div>

        {/* Input */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="p-3 border-t border-ink-100 flex gap-2"
        >
          {/* Mic button — toggles speech-to-text. While listening it
              pulses red and the transcript streams into the input box. */}
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
            className="flex-1 text-sm bg-ink-100/60 rounded-full px-4 py-2.5 outline-none focus:ring-2 focus:ring-brand-blue/30"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            className="bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2.5 rounded-full disabled:opacity-50"
          >
            Send
          </button>
        </form>

        {/* Footer hint */}
        <div className="px-5 py-2 border-t border-ink-100 text-[11px] text-ink-500 flex items-center justify-between">
          <span className="flex items-center gap-1">
            <MicIcon className="w-3 h-3" />{" "}
            {speechRec.supported
              ? "Speak or type — AI will reply with voice"
              : "AI will speak its answer"}
          </span>
          <button
            onClick={handleClose}
            className="text-brand-blue font-semibold hover:underline"
          >
            Resume lesson →
          </button>
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

// Locally serialize the lesson so we don't depend on src/data here.
function lessonToText(lesson) {
  if (!lesson?.sections) return "";
  return lesson.sections
    .map((s) => `## ${s.heading}\n${(s.sentences || []).join(" ")}`)
    .join("\n\n");
}
