import { SYSTEM_PROMPT, buildLessonPrompt, callChatCompletion, extractJSON, getProviderConfig } from "./aiProvider.js";

export async function lesson({ classLevel, subject, topic }) {
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
    return { status: r.status, body: { error: errText } };
  }

  const data = await r.json();
  const raw = data.choices?.[0]?.message?.content || "{}";
  const result = extractJSON(raw) || { title: topic, raw };
  return { status: 200, body: result };
}
