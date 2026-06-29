import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 5001;

// ---------- Provider configuration ----------
// Set AI_PROVIDER in .env to one of: "openai" | "groq" | "openrouter"
// All three speak the OpenAI Chat Completions wire format, so we just swap
// the base URL, API key, and default model name.
const PROVIDERS = {
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
    defaultModel: "meta-llama/llama-3.1-8b-instruct:free",
    extraHeaders: () => ({
      "HTTP-Referer": "http://localhost:5173",
      "X-Title": "PassPoint Demo",
    }),
    supportsJsonMode: false, // many free OR models ignore response_format
  },
};

const providerName = (process.env.AI_PROVIDER || "openai").toLowerCase();
const cfg = PROVIDERS[providerName];
if (!cfg) {
  console.error(
    `[passpoint-server] Unknown AI_PROVIDER="${providerName}". Use openai | groq | openrouter.`,
  );
  process.exit(1);
}
const API_KEY = process.env[cfg.keyEnv];
const MODEL = process.env[cfg.modelEnv] || cfg.defaultModel;

const SYSTEM_PROMPT = `You are PassPoint AI, a friendly, patient AI tutor for African students from Nursery to Senior Secondary School (Nigeria curriculum: WAEC, NECO, JAMB, BECE, etc.).

Rules:
- Adapt explanations to the student's class level (Nursery → SS3).
- Use simple language, short paragraphs, and real-life examples.
- For Mathematics: show step-by-step working.
- For Science: use diagrams described in words and analogies.
- Encourage the student. End with a follow-up question to check understanding when appropriate.
- If asked something outside the curriculum, politely steer back to learning.
- Keep responses concise (around 120-200 words) unless the student asks for more detail.`;

async function callProvider({ payload }) {
  const r = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...cfg.extraHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return r;
}

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: providerName,
    model: MODEL,
    baseUrl: cfg.baseUrl,
    hasKey: Boolean(API_KEY),
    keyEnvVar: cfg.keyEnv,
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({
        error: `${cfg.keyEnv} missing on server. Add it to .env and restart.`,
      });
    }

    const { messages = [], context = {} } = req.body || {};
    const { classLevel, subject, topic } = context;

    const contextLine = [
      classLevel && `Class: ${classLevel}`,
      subject && `Subject: ${subject}`,
      topic && `Current topic: ${topic}`,
    ]
      .filter(Boolean)
      .join(" | ");

    const finalSystem = contextLine
      ? `${SYSTEM_PROMPT}\n\nContext for this conversation -> ${contextLine}`
      : SYSTEM_PROMPT;

    const r = await callProvider({
      payload: {
        model: MODEL,
        messages: [
          { role: "system", content: finalSystem },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
        temperature: 0.6,
      },
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error(`[${providerName}] chat error:`, errText);
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    return res.json({ reply });
  } catch (err) {
    console.error("Chat error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

app.post("/api/lesson", async (req, res) => {
  try {
    if (!API_KEY) {
      return res.status(500).json({ error: `${cfg.keyEnv} missing` });
    }

    const { classLevel, subject, topic } = req.body || {};

    const prompt = `Create a structured lesson for a student.
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

    const payload = {
      model: MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    };
    if (cfg.supportsJsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const r = await callProvider({ payload });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    let raw = data.choices?.[0]?.message?.content || "{}";

    // Some providers (notably OpenRouter free models) wrap JSON in markdown
    // code fences or add a preamble. Strip both before parsing.
    raw = raw.trim();
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenced) raw = fenced[1].trim();
    const firstBrace = raw.indexOf("{");
    const lastBrace = raw.lastIndexOf("}");
    if (firstBrace > -1 && lastBrace > firstBrace) {
      raw = raw.slice(firstBrace, lastBrace + 1);
    }

    let lesson;
    try {
      lesson = JSON.parse(raw);
    } catch {
      lesson = { title: topic, raw };
    }
    return res.json(lesson);
  } catch (err) {
    console.error("Lesson error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
});

app.listen(PORT, () => {
  console.log(`[passpoint-server] running on http://localhost:${PORT}`);
  console.log(
    `[passpoint-server] provider=${providerName} model=${MODEL} baseUrl=${cfg.baseUrl} hasKey=${Boolean(API_KEY)}`,
  );
});
