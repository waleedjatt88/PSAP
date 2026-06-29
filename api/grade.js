import { callChatCompletion, extractJSON, getProviderConfig } from "../lib/provider.js";

// POST /api/grade
//
// Marks a photograph of a student's handwritten homework. The student
// uploads a base64-encoded image of their paper, and the AI returns:
//   { score, total, correct[], mistakes[], feedback, suggestions[] }
//
// Uses the active provider's vision model. For Groq the default vision
// model is `meta-llama/llama-4-scout-17b-16e-instruct` (multimodal).
// You can override via the GROQ_VISION_MODEL env var.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { image, lessonContent, topic, subject, classLevel, studentName } =
      req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Missing `image` (base64 data URL)" });
    }

    const cfg = getProviderConfig();
    // Vision-capable model name per provider.
    const visionModel =
      cfg.name === "groq"
        ? process.env.GROQ_VISION_MODEL ||
          "meta-llama/llama-4-scout-17b-16e-instruct"
        : cfg.name === "openai"
          ? process.env.OPENAI_VISION_MODEL || "gpt-4o-mini"
          : process.env.OPENROUTER_VISION_MODEL ||
            "meta-llama/llama-3.2-90b-vision-instruct";

    const system = [
      "You are PassPoint AI, a friendly secondary-school teacher in Nigeria marking a student's handwritten homework.",
      "",
      `Subject: ${subject || "Mathematics"} · Topic: ${topic || ""} · Class: ${classLevel || "JSS 1"}`,
      studentName ? `Student: ${studentName}` : "",
      "",
      "You will receive a photo of the student's paper. Some handwriting may be unclear — do your best to interpret each question and the student's answer. If you genuinely cannot read a question, mark it as 'unreadable' rather than guessing.",
      "",
      lessonContent
        ? `LESSON CONTENT (the questions are about this material):\n<<<\n${lessonContent}\n>>>`
        : "",
      "",
      "Mark every question you can identify. For each one, decide if the student's answer is correct, partly correct, or wrong. Give a fair score out of total possible marks. Be warm and encouraging — point out what the student did well, explain the mistake in simple terms, and tell them HOW to fix it.",
      "",
      "Return a SINGLE valid JSON object with this exact shape — no markdown, no prose outside JSON:",
      "{",
      '  "score": number,           // marks the student earned',
      '  "total": number,           // total marks available across detected questions',
      '  "percentage": number,      // 0-100',
      '  "grade": string,           // "Excellent" | "Very Good" | "Good" | "Fair" | "Needs Improvement"',
      '  "questions": [             // one entry per question detected',
      "    {",
      '      "number": number,      // question number',
      '      "question": string,    // your reading of the question text',
      '      "studentAnswer": string,// what the student wrote (or "unreadable")',
      '      "correctAnswer": string,',
      '      "isCorrect": boolean,',
      '      "marksAwarded": number,',
      '      "marksAvailable": number,',
      '      "feedback": string     // 1-2 sentences explaining the verdict',
      "    }",
      "  ],",
      '  "overallFeedback": string, // 2-4 sentence warm summary',
      '  "suggestions": [string]    // 2-3 specific next steps for the student',
      "}",
      "",
      "Output ONLY the JSON object.",
    ]
      .filter(Boolean)
      .join("\n");

    const payload = {
      model: visionModel,
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "Here is the student's homework. Please mark it and return JSON as instructed.",
            },
            { type: "image_url", image_url: { url: image } },
          ],
        },
      ],
      temperature: 0.2,
    };
    if (cfg.supportsJsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const { response: r } = await callChatCompletion(payload);
    if (!r.ok) {
      const errText = await r.text();
      console.error(`[${cfg.name}] grade error:`, errText);
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const result = extractJSON(raw);
    if (!result) {
      return res.status(500).json({
        error: "AI returned a non-JSON response",
        raw: raw.slice(0, 400),
      });
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error("[grade] handler error:", err);
    return res
      .status(err?.status || 500)
      .json({ error: String(err?.message || err) });
  }
}
