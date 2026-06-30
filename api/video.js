// On-demand REAL stock video clips for kindergarten objects. Mirrors
// api/image.js but hits the Pexels Videos API (same PEXELS_API_KEY).
//
// We pick a SMALL mp4 file (~ 360p–540p) so it preloads fast on tablet
// connections. The frontend autoplays it muted in a loop — kids see
// actual motion ("an apple falling", "a cat walking"), not just a photo.
//
// Falls through quietly when no video is found — the photo scene stays
// usable.

const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { word, hint } = req.body || {};
    if (!word || typeof word !== "string") {
      return res.status(400).json({ error: "word (string) required" });
    }

    const query = (hint || word).trim();
    const cacheKey = `${word.trim().toLowerCase()}::${hint || ""}`;
    const now = Date.now();
    const hit = cache.get(cacheKey);
    if (hit && hit.expiresAt > now) {
      return res.status(200).json({ ...hit.payload, cached: true });
    }

    if (!process.env.PEXELS_API_KEY) {
      return res.status(503).json({
        error:
          "PEXELS_API_KEY missing on server — required for /api/video. Add it to .env and restart.",
      });
    }

    // Pull a bigger list so we have room to FILTER for relevance.
    // Pexels' video search ranking is loose — the top result is often
    // a popular video tagged with the search word but actually about
    // something else. We score every candidate by whether the Pexels
    // page slug (which is built from the video's real title/tags)
    // contains the search word.
    const r = await fetch(
      `https://api.pexels.com/videos/search?per_page=20&orientation=square&size=small&query=${encodeURIComponent(query)}`,
      { headers: { Authorization: process.env.PEXELS_API_KEY } },
    );
    if (!r.ok) {
      const text = await r.text().catch(() => "");
      console.warn("[video] Pexels error:", r.status, text.slice(0, 200));
      return res.status(r.status).json({ error: `Pexels ${r.status}` });
    }
    const data = await r.json();
    const candidates = data?.videos || [];
    if (!candidates.length) {
      return res.status(404).json({ error: `Pexels: no video for "${query}"` });
    }

    // Relevance scoring is split into TWO checks:
    //   1. HARD GATE — the lesson's actual word (e.g. "apple") must
    //      appear in the Pexels page slug. This rejects unrelated
    //      "grapefruit" / "macbook" results that share *only* the
    //      hint word "fruit" / "tech".
    //   2. SOFT BONUS — hint words add ranking points so a more
    //      specific match (e.g. slug contains both "apple" and
    //      "fruit") beats a generic one ("apple" only).
    const strictWord = (word || "").trim().toLowerCase();
    const hintWords = (query || "")
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length >= 3 && w !== strictWord);

    function score(v) {
      const slug = (v.url || "").toLowerCase();
      if (!strictWord || !slug.includes(strictWord)) return -1; // gated out
      let s = 10;
      for (const w of hintWords) if (slug.includes(w)) s += 3;
      if (v.duration && v.duration <= 30) s += 1;
      else if (v.duration && v.duration > 60) s -= 2;
      return s;
    }

    const ranked = [...candidates]
      .map((v) => ({ v, s: score(v) }))
      .filter((x) => x.s >= 0)
      .sort((a, b) => b.s - a.s);

    if (!ranked.length) {
      console.warn(
        `[video] no Pexels match contains "${strictWord}" — examined ${candidates.length} candidates`,
      );
      return res
        .status(404)
        .json({ error: `Pexels: no relevant video for "${strictWord}"` });
    }
    const best = ranked[0].v;

    // Pexels returns `video_files` per resolution. Pick the smallest
    // mp4 ≥ 360p so it loads instantly without looking pixelated.
    const files = (best.video_files || [])
      .filter((f) => f.file_type === "video/mp4")
      .sort((a, b) => (a.width || 0) - (b.width || 0));
    const pick =
      files.find((f) => (f.width || 0) >= 360 && (f.width || 0) <= 720) ||
      files[0];
    if (!pick?.link) {
      return res.status(404).json({ error: "Pexels: no playable mp4 found" });
    }

    const payload = {
      url: pick.link,
      width: pick.width,
      height: pick.height,
      source: "pexels",
      credit: { name: best.user?.name, url: best.user?.url },
      pexelsPage: best.url,
    };
    cache.set(cacheKey, { payload, expiresAt: now + CACHE_TTL_MS });
    return res.status(200).json({ ...payload, cached: false });
  } catch (err) {
    console.error("[video] handler error:", err);
    return res
      .status(err?.status || 500)
      .json({ error: String(err?.message || err) });
  }
}
