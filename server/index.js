import express from "express";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

const PORT = process.env.PORT || 5001;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4.1";

const SYSTEM_PROMPT = `You are PassPoint AI, a friendly, patient AI tutor for African students from Nursery to Senior Secondary School (Nigeria curriculum: WAEC, NECO, JAMB, BECE, etc.).

Rules:
- Adapt explanations to the student's class level (Nursery → SS3).
- Use simple language, short paragraphs, and real-life examples.
- For Mathematics: show step-by-step working.
- For Science: use diagrams described in words and analogies.
- Encourage the student. End with a follow-up question to check understanding when appropriate.
- If asked something outside the curriculum, politely steer back to learning.
- Keep responses concise (around 120-200 words) unless the student asks for more detail.`;

app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    provider: process.env.AI_PROVIDER || "openai",
    model: OPENAI_MODEL,
    hasKey: Boolean(OPENAI_API_KEY),
  });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!OPENAI_API_KEY) {
      return res.status(500).json({
        error:
          "OPENAI_API_KEY missing on server. Add it to .env and restart the server.",
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

    const payload = {
      model: OPENAI_MODEL,
      messages: [
        { role: "system", content: finalSystem },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.6,
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error("OpenAI error:", errText);
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
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing" });
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

Only return valid JSON, no markdown.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.5,
        response_format: { type: "json_object" },
      }),
    });

    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
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
  console.log(`[passpoint-server] provider=openai model=${OPENAI_MODEL}`);
});
