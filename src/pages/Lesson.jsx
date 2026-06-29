import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../store/user";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  MicIcon,
  CloseIcon,
  CheckIcon,
} from "../components/icons";
import mascotImg from "../assets/AI_Lesson.png";
import mathImg from "../assets/Math.png";

const OUTLINE = [
  "What is a Fraction?",
  "Types of Fractions",
  "Equivalent Fractions",
  "Adding Fractions",
  "Practice Fractions",
];

const SUGGESTED = [
  "Explain in simpler words",
  "Give me an example",
  "What's the difference between ½ and ¼?",
  "Quiz me on fractions",
];

const DEFAULT_LESSON = {
  title: "Fractions",
  greeting:
    "Hello {name}! 👋 Today, we're going to learn about Fractions.",
  definition:
    "A fraction is a number that represents a part of a whole or a part of a group. It is written in the form a/b, where a and b are whole numbers and b ≠ 0. The number on the top is called the numerator, and the number on the bottom is called the denominator.",
  keyParts: [
    {
      name: "Numerator (a)",
      description:
        "The top number of a fraction. It shows how many equal parts are taken. Example: in 3/5, the numerator is 3.",
    },
    {
      name: "Denominator (b)",
      description:
        "The bottom number of a fraction. It shows the total number of equal parts. Example: in 3/5, the denominator is 5.",
    },
  ],
  keyTakeaways: [
    "A fraction represents a part of a whole.",
    "Numerator tells how many parts are taken.",
    "Denominator tells the total number of equal parts.",
  ],
  tipsFromAI:
    "Imagine a pizza cut into 4 equal slices. If you take 1 slice, you have 1/4 of the pizza!",
  outline: OUTLINE,
};

export default function Lesson() {
  const { user } = useUser();
  const [lesson, setLesson] = useState(DEFAULT_LESSON);
  const [activeStep, setActiveStep] = useState(0);
  const [tutorOpen, setTutorOpen] = useState(true);
  const [loading, setLoading] = useState(false);
  const voice = useVoiceLesson();

  // Fetch a fresh AI-generated lesson on mount (falls back to default if API fails)
  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const r = await fetch("/api/lesson", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classLevel: user?.classLevel || "JSS 1",
            subject: "Mathematics",
            topic: "Fractions",
          }),
        });
        if (!r.ok) throw new Error("Lesson API failed");
        const data = await r.json();
        if (!alive) return;
        // Merge with defaults so missing fields still render
        setLesson((prev) => ({ ...prev, ...data }));
      } catch (e) {
        console.warn("Using default lesson:", e.message);
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, [user?.classLevel]);

  const greeting = (lesson.greeting || DEFAULT_LESSON.greeting).replace(
    "{name}",
    user?.name?.split(" ")[0] || "there",
  );
  const progress = ((activeStep + 1) / OUTLINE.length) * 100;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 text-sm text-ink-700 hover:text-ink-900">
          <ArrowLeftIcon className="w-4 h-4" /> AI Lesson
        </Link>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-ink-500">Progress</span>
          <div className="h-2 w-40 rounded-full bg-ink-100 overflow-hidden">
            <div className="h-full bg-brand-blue" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-semibold">{Math.round(progress)}%</span>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Main lesson */}
        <div className={`${tutorOpen ? "col-span-12 lg:col-span-8 xl:col-span-9" : "col-span-12"} space-y-4 transition-all`}>
          {/* AI Tutor greeting card */}
          <div className="bg-white rounded-2xl shadow-card p-5 flex items-start gap-4">
            <Mascot />
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-blue bg-blue-50 rounded-full px-3 py-1">
                ✨ AI Tutor
              </div>
              <h2 className="text-xl font-bold mt-2">{greeting}</h2>
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => voice.toggle(buildLessonScript(lesson, greeting))}
                  disabled={!voice.supported}
                  title={
                    !voice.supported
                      ? "Voice not supported in this browser"
                      : voice.state === "playing"
                        ? "Pause voice lesson"
                        : voice.state === "paused"
                          ? "Resume voice lesson"
                          : "Play voice lesson"
                  }
                  className="w-9 h-9 rounded-full bg-brand-blue text-white flex items-center justify-center hover:bg-brand-blue-dark disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {voice.state === "playing" ? "⏸" : "▶"}
                </button>
                {voice.state !== "idle" && (
                  <button
                    onClick={voice.stop}
                    title="Stop voice lesson"
                    className="w-9 h-9 rounded-full bg-ink-100 text-ink-700 flex items-center justify-center hover:bg-ink-300"
                  >
                    ■
                  </button>
                )}
                <WaveBars active={voice.state === "playing"} />
                <span className="text-xs text-ink-500 ml-1">
                  {voice.state === "playing"
                    ? "🔊 Speaking…"
                    : voice.state === "paused"
                      ? "Paused"
                      : !voice.supported
                        ? "Voice not supported"
                        : "Voice lesson"}
                </span>
                {voice.supported && (
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[10px] text-ink-500">Speed</span>
                    {[0.85, 1, 1.25].map((r) => (
                      <button
                        key={r}
                        onClick={() => voice.setRate(r)}
                        className={`text-[10px] px-1.5 py-0.5 rounded ${
                          voice.rate === r
                            ? "bg-brand-blue text-white"
                            : "bg-ink-100 text-ink-700 hover:bg-ink-300"
                        }`}
                      >
                        {r}×
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {loading && (
                <div className="text-xs text-ink-500 mt-2">
                  ✨ Personalizing lesson with AI…
                </div>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl shadow-card p-5">
              <h3 className="font-bold text-ink-900">What is {lesson.title}?</h3>
              <p className="text-sm text-ink-700 mt-2 leading-relaxed">
                {lesson.definition}
              </p>

              <div className="mt-4 space-y-3">
                {(lesson.keyParts || []).map((p) => (
                  <div key={p.name} className="bg-orange-50 border border-orange-100 rounded-xl p-3">
                    <div className="text-sm font-semibold text-brand-orange-dark">
                      {p.name}
                    </div>
                    <div className="text-xs text-ink-700 mt-1">{p.description}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-card p-5 flex items-center justify-center">
              <img src={mathImg} alt="Fraction example" className="w-56 h-56 object-contain" />
            </div>
          </div>

          {/* Footer nav */}
          <div className="bg-white rounded-2xl shadow-card p-3 flex items-center justify-between">
            <button
              onClick={() => setActiveStep((s) => Math.max(0, s - 1))}
              className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2"
            >
              <ArrowLeftIcon className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setTutorOpen(true)}
              className="flex items-center gap-2 bg-brand-blue text-white text-sm font-semibold px-5 py-2.5 rounded-full shadow-card hover:bg-brand-blue-dark"
            >
              <MicIcon className="w-4 h-4" /> ASK AI
            </button>
            <button
              onClick={() =>
                setActiveStep((s) => Math.min(OUTLINE.length - 1, s + 1))
              }
              className="flex items-center gap-2 text-sm font-medium text-ink-700 hover:text-ink-900 px-3 py-2"
            >
              Next <ArrowRightIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right column: Outline + Key takeaways OR AI Tutor chat */}
        <div className={`${tutorOpen ? "col-span-12 lg:col-span-4 xl:col-span-3" : "hidden"}`}>
          <AITutorPanel
            user={user}
            topic={lesson.title}
            keyTakeaways={lesson.keyTakeaways}
            tipsFromAI={lesson.tipsFromAI}
            outline={lesson.outline || OUTLINE}
            activeStep={activeStep}
            setActiveStep={setActiveStep}
            onClose={() => setTutorOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}

function AITutorPanel({
  user,
  topic,
  keyTakeaways,
  tipsFromAI,
  outline,
  activeStep,
  setActiveStep,
  onClose,
}) {
  const [tab, setTab] = useState("outline");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, sending]);

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
            classLevel: user?.classLevel || "JSS 1",
            subject: "Mathematics",
            topic,
          },
        }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || "Chat failed");
      setMessages((m) => [...m, { role: "assistant", content: data.reply || "(no reply)" }]);
    } catch (err) {
      const raw = String(err?.message || err);
      let friendly =
        "Sorry, I couldn't reach the AI service right now. Please try again in a moment.";
      if (/invalid_api_key|Incorrect API key/i.test(raw)) {
        friendly =
          "⚠️ The OpenAI API key is invalid or expired. Update OPENAI_API_KEY in .env and restart the dev server.";
      } else if (/insufficient_quota|exceeded_quota/i.test(raw)) {
        friendly =
          "⚠️ This OpenAI account has run out of credits. Add billing or use a different key.";
      } else if (/rate_limit/i.test(raw)) {
        friendly = "⚠️ Hit the OpenAI rate limit. Wait a few seconds and try again.";
      } else if (/missing/i.test(raw)) {
        friendly = "⚠️ OPENAI_API_KEY is missing on the server. Add it to .env and restart.";
      }
      setMessages((m) => [...m, { role: "assistant", content: friendly }]);
      console.error("[chat]", raw);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-card flex flex-col h-[32rem] lg:h-[calc(100vh-9rem)] lg:sticky lg:top-20">
      <div className="flex items-center justify-between px-4 py-3 border-b border-ink-100">
        <div className="font-bold flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500" /> AI Tutor
        </div>
        <button onClick={onClose} className="text-ink-500 hover:text-ink-900">
          <CloseIcon className="w-4 h-4" />
        </button>
      </div>

      <div className="px-3 pt-3 grid grid-cols-2 gap-1 text-xs">
        <TabBtn active={tab === "outline"} onClick={() => setTab("outline")}>
          Outline
        </TabBtn>
        <TabBtn active={tab === "chat"} onClick={() => setTab("chat")}>
          Ask AI
        </TabBtn>
      </div>

      {tab === "outline" ? (
        <div className="p-3 overflow-y-auto space-y-4">
          <div>
            <div className="text-xs font-semibold text-ink-500 mb-2">
              Lessons Outline
            </div>
            <ol className="space-y-1">
              {outline.map((o, i) => (
                <li key={o}>
                  <button
                    onClick={() => setActiveStep(i)}
                    className={`w-full text-left text-xs px-2.5 py-2 rounded-lg flex items-center gap-2 ${
                      i === activeStep
                        ? "bg-brand-blue/10 text-brand-blue font-semibold"
                        : "hover:bg-ink-100 text-ink-700"
                    }`}
                  >
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                        i <= activeStep
                          ? "bg-brand-blue text-white"
                          : "bg-ink-100 text-ink-500"
                      }`}
                    >
                      {i < activeStep ? <CheckIcon className="w-3 h-3" /> : i + 1}
                    </span>
                    {o}
                  </button>
                </li>
              ))}
            </ol>
          </div>

          {keyTakeaways?.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-ink-500 mb-2">
                Key Takeaways
              </div>
              <ul className="space-y-2">
                {keyTakeaways.map((k, i) => (
                  <li
                    key={i}
                    className="text-xs bg-blue-50 border border-blue-100 rounded-lg p-2 text-ink-700"
                  >
                    {k}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tipsFromAI && (
            <div>
              <div className="text-xs font-semibold text-ink-500 mb-2">
                Tips from AI
              </div>
              <div className="text-xs bg-orange-50 border border-orange-100 rounded-lg p-3 text-ink-700">
                💡 {tipsFromAI}
              </div>
            </div>
          )}

          <button
            onClick={() => setTab("chat")}
            className="w-full bg-brand-blue text-white text-xs font-semibold py-2 rounded-lg hover:bg-brand-blue-dark"
          >
            Continue Lesson →
          </button>
        </div>
      ) : (
        <>
          <div className="p-3 border-b border-ink-100">
            <div className="text-xs font-semibold text-ink-500 mb-2">
              Try a question
            </div>
            <div className="flex flex-wrap gap-1.5">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] bg-ink-100 hover:bg-ink-100/60 rounded-full px-2.5 py-1 text-ink-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-3">
            {messages.length === 0 && !sending && (
              <div className="text-xs text-ink-500 text-center py-8">
                Ask me anything about <strong>{topic}</strong> 🤖
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`text-xs leading-relaxed rounded-xl p-2.5 max-w-[90%] whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-brand-blue text-white ml-auto"
                    : "bg-ink-100 text-ink-900"
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div className="text-xs bg-ink-100 rounded-xl p-2.5 inline-flex items-center gap-1">
                <Dot /> <Dot delay={150} /> <Dot delay={300} />
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="p-3 border-t border-ink-100 flex gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the AI tutor…"
              className="flex-1 text-xs bg-ink-100/60 rounded-full px-3 py-2 outline-none focus:ring-2 focus:ring-brand-blue/30"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="bg-brand-blue text-white text-xs font-semibold px-3 py-2 rounded-full disabled:opacity-50 hover:bg-brand-blue-dark"
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
}

function TabBtn({ active, ...p }) {
  return (
    <button
      {...p}
      className={`py-1.5 rounded-lg font-semibold transition-colors ${
        active ? "bg-brand-blue/10 text-brand-blue" : "text-ink-500 hover:bg-ink-100"
      }`}
    />
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

function Mascot() {
  return (
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-orange-100 flex items-center justify-center shrink-0 overflow-hidden">
      <img src={mascotImg} alt="AI Tutor" className="h-20 w-20 object-contain" />
    </div>
  );
}

function WaveBars({ active = false }) {
  const heights = [6, 12, 18, 14, 22, 10, 16, 8, 18, 12, 6];
  return (
    <div className="flex items-end gap-0.5 h-6">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-brand-blue/70 ${active ? "wave-bar" : ""}`}
          style={{
            height: `${h}px`,
            animationDelay: active ? `${i * 80}ms` : undefined,
          }}
        />
      ))}
    </div>
  );
}

// ---------- Voice lesson (Web Speech API) ----------

function buildLessonScript(lesson, greeting) {
  const parts = [
    greeting,
    `What is ${lesson.title}?`,
    lesson.definition,
    ...(lesson.keyParts || []).map(
      (p) => `${p.name}. ${p.description}`,
    ),
  ];
  if (lesson.tipsFromAI) parts.push(`Tip from AI: ${lesson.tipsFromAI}`);
  return parts.filter(Boolean).join(". ");
}

function useVoiceLesson() {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;
  const [state, setState] = useState("idle"); // 'idle' | 'playing' | 'paused'
  const [rate, setRateState] = useState(1);
  const utterRef = useRef(null);

  // Cleanup on unmount: stop any speech in progress
  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  // Pick a pleasant English voice when available
  function pickVoice() {
    if (!supported) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    // Prefer English Google/Microsoft natural voices, female if available
    const preferred =
      voices.find((v) => /en[-_]?(US|GB|NG)/i.test(v.lang) && /female|samantha|jenny|aria/i.test(v.name)) ||
      voices.find((v) => /en[-_]?(US|GB|NG)/i.test(v.lang) && /google|microsoft|natural/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0];
    return preferred;
  }

  function play(script) {
    if (!supported || !script) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(script);
    u.lang = "en-US";
    u.rate = rate;
    u.pitch = 1.05;
    const v = pickVoice();
    if (v) u.voice = v;
    u.onend = () => setState("idle");
    u.onerror = () => setState("idle");
    utterRef.current = u;
    window.speechSynthesis.speak(u);
    setState("playing");
  }

  function toggle(script) {
    if (!supported) return;
    if (state === "playing") {
      window.speechSynthesis.pause();
      setState("paused");
    } else if (state === "paused") {
      window.speechSynthesis.resume();
      setState("playing");
    } else {
      play(script);
    }
  }

  function stop() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    setState("idle");
  }

  function setRate(r) {
    setRateState(r);
    // If currently speaking, restart with the new rate from the same text
    if (state !== "idle" && utterRef.current) {
      const text = utterRef.current.text;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = r;
      u.pitch = 1.05;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onend = () => setState("idle");
      u.onerror = () => setState("idle");
      utterRef.current = u;
      window.speechSynthesis.speak(u);
      setState("playing");
    }
  }

  return { supported, state, rate, toggle, stop, setRate };
}

