import { getProviderConfig } from "../lib/provider.js";

export default function handler(_req, res) {
  try {
    const cfg = getProviderConfig();
    res.status(200).json({
      ok: true,
      provider: cfg.name,
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      hasKey: Boolean(cfg.apiKey),
      keyEnvVar: cfg.keyEnv,
      runtime: "vercel",
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
