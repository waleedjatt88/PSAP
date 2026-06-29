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
  const { classLevel, subject, topic } = context;
  const contextLine = [
    classLevel && `Class: ${classLevel}`,
    subject && `Subject: ${subject}`,
    topic && `Current topic: ${topic}`,
  ]
    .filter(Boolean)
    .join(" | ");
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
