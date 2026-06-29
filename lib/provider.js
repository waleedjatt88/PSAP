// Shared AI provider logic. Used by both the local Express server
// (server/index.js) and the Vercel serverless functions (api/*.js).
// All three supported providers speak the OpenAI Chat Completions wire
// format — we just swap base URL, key, and default model.

export const PROVIDERS = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    keyEnv: "OPENAI_API_KEY",
    modelEnv: "OPENAI_MODEL",
    defaultModel: "gpt-4.1",
    extraHeaders: () => ({}),
    supportsJsonMode: true,
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    keyEnv: "GROQ_API_KEY",
    modelEnv: "GROQ_MODEL",
    defaultModel: "llama-3.3-70b-versatile",
    extraHeaders: () => ({}),
    supportsJsonMode: true,
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    keyEnv: "OPENROUTER_API_KEY",
    modelEnv: "OPENROUTER_MODEL",
    defaultModel: "google/gemma-4-31b-it:free",
    extraHeaders: () => ({
      "HTTP-Referer":
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:5173",
      "X-Title": "PassPoint Demo",
    }),
    supportsJsonMode: false,
  },
};

export const SYSTEM_PROMPT = `You are PassPoint AI, a friendly, patient AI tutor for African students from Nursery to Senior Secondary School (Nigeria curriculum: WAEC, NECO, JAMB, BECE, etc.).

Rules:
- Adapt explanations to the student's class level (Nursery → SS3).
- Use simple language, short paragraphs, and real-life examples.
- For Mathematics: show step-by-step working.
- For Science: use diagrams described in words and analogies.
- Encourage the student. End with a follow-up question to check understanding when appropriate.
- If asked something outside the curriculum, politely steer back to learning.
- Keep responses concise (around 120-200 words) unless the student asks for more detail.`;

export function getProviderConfig() {
  const name = (process.env.AI_PROVIDER || "openai").toLowerCase();
  const cfg = PROVIDERS[name];
  if (!cfg) {
    throw new Error(
      `Unknown AI_PROVIDER="${name}". Use openai | groq | openrouter.`,
    );
  }
  return {
    name,
    ...cfg,
    apiKey: process.env[cfg.keyEnv],
    model: process.env[cfg.modelEnv] || cfg.defaultModel,
  };
}

export async function callChatCompletion(payload) {
  const cfg = getProviderConfig();
  if (!cfg.apiKey) {
    const err = new Error(`${cfg.keyEnv} missing on server. Add it to .env and restart.`);
    err.status = 500;
    throw err;
  }
  const r = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      "Content-Type": "application/json",
      ...cfg.extraHeaders(),
    },
    body: JSON.stringify({ ...payload, model: payload.model || cfg.model }),
  });
  return { response: r, cfg };
}

// Extract a JSON object from a string that may contain markdown fences,
// preamble text, or trailing commentary. Used by /api/lesson.
export function extractJSON(raw) {
  if (!raw) return null;
  let s = raw.trim();
  const fenced = s.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) s = fenced[1].trim();
  const first = s.indexOf("{");
  const last = s.lastIndexOf("}");
  if (first > -1 && last > first) s = s.slice(first, last + 1);
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}

export function buildSystemPrompt(context = {}) {
  const { classLevel, subject, topic, lessonContent } = context;
  const contextLine = [
    classLevel && `Class: ${classLevel}`,
    subject && `Subject: ${subject}`,
    topic && `Current topic: ${topic}`,
  ]
    .filter(Boolean)
    .join(" | ");

  // The AI is constrained to use LESSON_CONTENT as its only knowledge
  // source — but it IS allowed to teach with it: explain, summarize,
  // give examples, quiz the student, etc. We use structured JSON so the
  // server can enforce a canonical refusal when a question is truly
  // off-topic (e.g., asking about photosynthesis during a Fractions
  // lesson).
  if (lessonContent) {
    return [
      "You are PassPoint AI, a friendly teacher presenting a fixed lesson to a student.",
      "",
      `CURRENT LESSON: ${topic || "this topic"} (${subject || ""} · ${classLevel || ""})`,
      "",
      "Your ONLY source of subject knowledge is the LESSON_CONTENT below. You may not introduce facts about the topic that aren't supported by LESSON_CONTENT. But you ARE free to TEACH with that content — explain it, re-explain it more simply, give relatable everyday examples (using familiar Nigerian context like naira, mango, jollof rice, classroom items), create quizzes/exercises, and summarize.",
      "",
      "LESSON_CONTENT:",
      "<<<",
      lessonContent,
      
      ">>>",
      "",
      "Respond to every student message as a SINGLE valid JSON object with this exact shape — no markdown, no prose outside JSON:",
      "{",
      '  "in_scope": boolean,   // true if the message is a legitimate teaching activity grounded in LESSON_CONTENT (see DECISION RULE)',
      '  "answer": string       // your full answer when in_scope=true; "" (empty) when in_scope=false — the server will fill the refusal',
      "}",
      "",
      "DECISION RULE — be GENEROUS for legitimate teaching activities, STRICT for truly off-topic / abusive input:",
      "",
      "*** CONVERSATIONAL CONTEXT IS CRITICAL ***",
      "Look at the FULL message history, not just the latest message. If your previous turn asked the student a question (especially during a quiz), then their reply — even if it is a single word, single digit, single letter (A/B/C/D), or short phrase like \"five\", \"nine\", \"yes\", \"I don't know\" — IS the student answering you. It IS in_scope. You MUST acknowledge whether their answer is correct, give the correct answer if they were wrong, and then continue (ask the next question, or wrap up).",
      "",
      "IN_SCOPE=TRUE examples:",
      `  - "What is a proper fraction?" → answer using the lesson definition`,
      `  - "Can you give me an example?" → give a fresh everyday example of a lesson concept`,
      `  - "Explain that again simpler" → re-explain a lesson section in simpler words`,
      `  - "Create a quiz with 10 MCQs and an answer key" → use the OFFICIAL QUIZ BANK verbatim`,
      `  - "Quiz me on this" → ask ONE official quiz question, wait for the student's reply`,
      `  - Student replying "5" / "nine" / "B" / "A proper fraction" AFTER you asked a quiz question → mark right/wrong, give correct answer if needed, then ask the next question`,
      `  - "Summarise the lesson" → recap the lesson sections`,
      `  - "Why is this important?" → explain real-world relevance using everyday examples`,
      "",
      "IN_SCOPE=FALSE examples (truly off-topic or abusive):",
      `  - "What is photosynthesis?" during a Fractions lesson`,
      `  - "Capital of France?" (unrelated factual question)`,
      `  - Profanity / insults / spam`,
      `  - Requests for outside knowledge ("write a poem", "what's the weather")`,
      "",
      "STYLE when in_scope=true:",
      "- Warm, encouraging teacher voice.",
      "- Short answers (2-4 sentences) for simple questions.",
      "- For quizzes/MCQs/tests/assignments: IF LESSON_CONTENT contains an 'OFFICIAL QUIZ BANK' section (Quick Quiz / MCQs / Theory / Assignment), you MUST use those EXACT questions verbatim — same wording, same options, same answer key, same marks. Do not invent new questions. Choose the right set based on what the student asks for: \"MCQs\" → Multiple Choice Questions block; \"quiz\" or \"quick quiz\" → Quick Quiz block; \"theory\" → Theory Questions; \"assignment\" or \"homework\" → Assignment block. If the student asks for more questions than the bank contains, return what's available and say so.",
      "- For MCQs format each as: question, then options A/B/C/D each on a new line, then mark total. Put the full answer key at the end as a separate list.",
      "- For 'quiz me' (interactive): ask ONE question at a time from the bank and wait for the student's answer before showing the next one.",
      "- End short answers with a brief check-for-understanding question when natural.",
      "- Use the exact terminology and definitions from LESSON_CONTENT.",
      "",
      "When in_scope=false: leave 'answer' empty — server returns the canonical refusal. Do not try to be helpful by including any off-topic information.",
      "",
      "Output ONLY the JSON object. No preamble, no postscript, no markdown fences.",
    ].join("\n");
  }

  return contextLine
    ? `${SYSTEM_PROMPT}\n\nContext for this conversation -> ${contextLine}`
    : SYSTEM_PROMPT;
}

export function buildLessonPrompt({ classLevel, subject, topic }) {
  return `Create a structured lesson for a student.
Class: ${classLevel || "JSS1"}
Subject: ${subject || "Mathematics"}
Topic: ${topic || "Fractions"}

Return JSON with this exact shape:
{
  "title": "...",
  "greeting": "A 1-sentence friendly greeting that mentions the topic",
  "definition": "A 2-3 sentence age-appropriate definition",
  "keyParts": [{"name": "...", "description": "..."}],
  "keyTakeaways": ["...", "...", "..."],
  "tipsFromAI": "A short encouraging tip (1-2 sentences)",
  "outline": ["What is X?", "Types of X", "..."]
}

Only return valid JSON, no markdown, no preamble.`;
}
