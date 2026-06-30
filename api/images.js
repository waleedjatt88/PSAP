// Multi-photo fetch for the "Show more" button. Returns up to N Pexels
// photos for the given word/hint so the child can browse a small
// gallery of the same object (e.g. five different apples).
//
// Cached by `${word}::${hint}::${count}` for 6 hours so repeated
// "Show more" taps don't hit the network.

const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const DEFAULT_COUNT = 6;
const MAX_COUNT = 12;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { word, hint, count } = req.body || {};
    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "word (string) required" });
    }
    const want = Math.min(MAX_COUNT, Math.max(1, Number(count) || DEFAULT_COUNT));

    const query = (hint || word).trim();
    const cacheKey = `${word.trim().toLowerCase()}::${hint || ""}::${want}`;
    const now = Date.now();
    const hit = cache.get(cacheKey);
    if (hit && hit.expiresAt > now) {
      return res.status(200).json({ photos: hit.payload, cached: true });
    }

    if (!process.env.PEXELS_API_KEY) {
      return res.status(503).json({
        error: "PEXELS_API_KEY missing on server — required for /api/images.",
      });
    }

    const r = await fetch(
      `https://api.pexels.com/v1/search?per_page=${want}&orientation=square&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } },
    );
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.warn("[images] Pexels error:", r.status, text.slice(0, 200));
      return res.status(r.status).json({ error: `Pexels ${r.status}` });
    }
    const data = await r.json();
    const photos = (data?.photos || []).map((p) => ({
      url: p.src?.large || p.src?.medium || p.src?.original,
      thumb: p.src?.medium || p.src?.small,
      credit: { name: p.photographer, url: p.photographer_url },
    })).filter((p) => p.url);

    if (!photos.length) {
      return res.status(404).json({ error: `Pexels: no photos for "${query}"` });
    }

    cache.set(cacheKey, { payload: photos, expiresAt: now + CACHE_TTL_MS });
    return res.status(200).json({ photos, cached: false });
  } catch (err) {
    console.error("[images] handler error:", err);
    return res
      .status(err?.status || 500)
      .json({ error: String(err?.message || err) });
  }
}
