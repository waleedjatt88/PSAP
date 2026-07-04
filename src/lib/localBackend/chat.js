import { buildSystemPrompt, callChatCompletion, extractJSON, getProviderConfig } from "./aiProvider.js";

// Canonical refusal returned whenever the AI marks a question as
// out-of-scope of the supplied lesson content. Defined here so the model
// cannot bypass it.
function buildRefusal(topic) {
  return `That's a great question, but it isn't part of today's lesson on ${
    topic || "this topic"
  }. We'll come back to it in another class. For now, let's stay with what we're learning today.`;
}

export async function chat({ messages = [], context = {} }) {
  const finalSystem = buildSystemPrompt(context);
  const isKindergarten = context.classLevel === "Kindergarten";
  const lockedToLesson = Boolean(context.lessonContent) && !isKindergarten;
  const cfg = getProviderConfig();

  const payload = {
    messages: [
      { role: "system", content: finalSystem },
      ...messages.map((m) => ({ role: m.role, content: m.content })),
    ],
    temperature: lockedToLesson ? 0.1 : 0.6,
  };
  if (lockedToLesson && cfg.supportsJsonMode) {
    payload.response_format = { type: "json_object" };
  }

  const { response: r } = await callChatCompletion(payload);
  if (!r.ok) {
    const errText = await r.text();
    console.error(`[${cfg.name}] chat error:`, errText);
    return { status: r.status, body: { error: errText } };
  }

  const data = await r.json();
  const raw = data.choices?.[0]?.message?.content?.trim() || "";

  if (!lockedToLesson) {
    return { status: 200, body: { reply: raw } };
  }

  const parsed = extractJSON(raw);
  const refusal = buildRefusal(context.topic);

  if (!parsed || typeof parsed.in_scope !== "boolean") {
    console.warn("[chat] locked mode: non-JSON reply, falling back to refusal:", raw.slice(0, 200));
    return { status: 200, body: { reply: refusal, scope: "fallback" } };
  }
  if (parsed.in_scope === false) {
    return { status: 200, body: { reply: refusal, scope: "refused" } };
  }
  const answer = String(parsed.answer || "").trim();
  if (!answer) {
    return { status: 200, body: { reply: refusal, scope: "empty" } };
  }
  return { status: 200, body: { reply: answer, scope: "in_scope" } };
}
