import {
  buildSystemPrompt,
  callChatCompletion,
  extractJSON,
  getProviderConfig,
} from "../lib/provider.js";

// Canonical refusal returned whenever the AI marks a question as
// out-of-scope of the supplied lesson content. Defined here, on the
// server, so the model cannot bypass it.
function buildRefusal(topic) {
  return `That's a great question, but it isn't part of today's lesson on ${
    topic || "this topic"
  }. We'll come back to it in another class. For now, let's stay with what we're learning today.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { messages = [], context = {} } = req.body || {};
    const finalSystem = buildSystemPrompt(context);
    const lockedToLesson = Boolean(context.lessonContent);
    const cfg = getProviderConfig();

    // Lower temperature when locked to a lesson — strict rule following
    // beats creative response. JSON mode is requested for both Groq and
    // OpenAI (OpenRouter sometimes ignores it, but we strip fences anyway).
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
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    const raw = data.choices?.[0]?.message?.content?.trim() || "";

    if (!lockedToLesson) {
      return res.status(200).json({ reply: raw });
    }

    // Locked-to-lesson mode: parse the JSON envelope and enforce scope.
    const parsed = extractJSON(raw);
    const refusal = buildRefusal(context.topic);

    if (!parsed || typeof parsed.in_scope !== "boolean") {
      // Model returned non-JSON / malformed JSON — fall back to refusal
      // so we never leak off-topic content.
      console.warn("[chat] locked mode: non-JSON reply, falling back to refusal:", raw.slice(0, 200));
      return res.status(200).json({ reply: refusal, scope: "fallback" });
    }
    if (parsed.in_scope === false) {
      return res.status(200).json({ reply: refusal, scope: "refused" });
    }
    const answer = String(parsed.answer || "").trim();
    if (!answer) {
      return res.status(200).json({ reply: refusal, scope: "empty" });
    }
    return res.status(200).json({ reply: answer, scope: "in_scope" });
  } catch (err) {
    console.error("[chat] handler error:", err);
    return res
      .status(err?.status || 500)
      .json({ error: String(err?.message || err) });
  }
}
