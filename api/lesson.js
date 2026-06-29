import {
  SYSTEM_PROMPT,
  buildLessonPrompt,
  callChatCompletion,
  extractJSON,
  getProviderConfig,
} from "../lib/provider.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { classLevel, subject, topic } = req.body || {};
    const cfg = getProviderConfig();
    const prompt = buildLessonPrompt({ classLevel, subject, topic });

    const payload = {
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
      temperature: 0.5,
    };
    if (cfg.supportsJsonMode) {
      payload.response_format = { type: "json_object" };
    }

    const { response: r } = await callChatCompletion(payload);
    if (!r.ok) {
      const errText = await r.text();
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content || "{}";
    const lesson = extractJSON(raw) || { title: topic, raw };
    return res.status(200).json(lesson);
  } catch (err) {
    console.error("[lesson] handler error:", err);
    return res
      .status(err?.status || 500)
      .json({ error: String(err?.message || err) });
  }
}
