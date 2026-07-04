import { callChatCompletion, extractJSON, getProviderConfig } from "./aiProvider.js";

// Marks a photograph of a student's handwritten homework. Uses the active
// provider's vision model.
export async function grade({ image, lessonContent, topic, subject, classLevel, studentName }) {
  if (!image || typeof image !== "string") {
    return { status: 400, body: { error: "Missing `image` (base64 data URL)" } };
  }

  const cfg = getProviderConfig();
  const env = import.meta.env;
  const visionModel =
    cfg.name === "groq"
      ? env.VITE_GROQ_VISION_MODEL || "meta-llama/llama-4-scout-17b-16e-instruct"
      : cfg.name === "openai"
        ? env.VITE_OPENAI_VISION_MODEL || "gpt-4o-mini"
        : env.VITE_OPENROUTER_VISION_MODEL || "meta-llama/llama-3.2-90b-vision-instruct";

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
          { type: "text", text: "Here is the student's homework. Please mark it and return JSON as instructed." },
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
    return { status: r.status, body: { error: errText } };
  }

  const data = await r.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  const result = extractJSON(raw);
  if (!result) {
    return {
      status: 500,
      body: { error: "AI returned a non-JSON response", raw: raw.slice(0, 400) },
    };
  }
  return { status: 200, body: result };
}
