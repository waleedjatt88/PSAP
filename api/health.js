import { getProviderConfig } from "../lib/provider.js";
import { connectToDatabase, getConnectionState } from "../lib/mongodb.js";

export default async function handler(_req, res) {
  try {
    // Attempt MongoDB connection to ensure state is active/accurate
    await connectToDatabase().catch(() => {});

    const dbState = getConnectionState();
    const cfg = getProviderConfig();

    res.status(200).json({
      ok: true,
      provider: cfg.name,
      model: cfg.model,
      baseUrl: cfg.baseUrl,
      hasKey: Boolean(cfg.apiKey),
      keyEnvVar: cfg.keyEnv,
      runtime: "vercel",
      mongodb: dbState,
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err?.message || err) });
  }
}
