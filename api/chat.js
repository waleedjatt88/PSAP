import { buildSystemPrompt, callChatCompletion } from "../lib/provider.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { messages = [], context = {} } = req.body || {};
    const finalSystem = buildSystemPrompt(context);

    const { response: r, cfg } = await callChatCompletion({
      messages: [
        { role: "system", content: finalSystem },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
      temperature: 0.6,
    });

    if (!r.ok) {
      const errText = await r.text();
      console.error(`[${cfg.name}] chat error:`, errText);
      return res.status(r.status).json({ error: errText });
    }

    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "";
    return res.status(200).json({ reply });
  } catch (err) {
    console.error("[chat] handler error:", err);
    return res
      .status(err?.status || 500)
      .json({ error: String(err?.message || err) });
  }
}


