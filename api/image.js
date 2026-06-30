// On-demand REAL photo fetch for kindergarten alphabet objects (A for
// Apple, B for Ball, …). No generation, no procedural anything — just
// real stock photos from real photographers.
//
// Provider waterfall (first one with a configured key wins):
//   1. Vecteezy    — needs VECTEEZY_API_KEY    (user's primary choice)
//   2. Pexels      — needs PEXELS_API_KEY      (free signup, generous tier)
//   3. Unsplash    — needs UNSPLASH_ACCESS_KEY (free signup, 50/hr)
//   4. → return 503 so the frontend uses the emoji fallback
//
// Set whichever key you have in passpoint-demo/.env. You only need ONE.
// Results are cached in-memory by `${word}::${hint}` so subsequent slide
// visits never hit the network again.

const cache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

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
      return res.status(200).json({ url: hit.url, source: hit.source, cached: true });
    }

    // Track per-provider errors so we can surface them in the response.
    // Without this, a failing Vecteezy call gets logged but the client
    // just sees a generic 503 — painful to debug.
    const tried = [];
    let result = null;

    if (process.env.VECTEEZY_API_KEY) {
      try {
        result = await fetchFromVecteezy(query);
      } catch (err) {
        tried.push({ provider: "vecteezy", error: err.message });
        console.warn("[image] Vecteezy failed:", err.message);
      }
    }
    if (!result && process.env.PEXELS_API_KEY) {
      try {
        result = await fetchFromPexels(query);
      } catch (err) {
        tried.push({ provider: "pexels", error: err.message });
        console.warn("[image] Pexels failed:", err.message);
      }
    }
    if (!result && process.env.UNSPLASH_ACCESS_KEY) {
      try {
        result = await fetchFromUnsplash(query);
      } catch (err) {
        tried.push({ provider: "unsplash", error: err.message });
        console.warn("[image] Unsplash failed:", err.message);
      }
    }

    if (!result) {
      const message = tried.length
        ? `All photo providers failed: ${tried.map((t) => `${t.provider}(${t.error})`).join("; ")}`
        : "No photo provider configured. Add VECTEEZY_API_KEY (https://www.vecteezy.com/api), PEXELS_API_KEY (https://www.pexels.com/api), or UNSPLASH_ACCESS_KEY (https://unsplash.com/developers) to .env and restart the dev server.";
      return res.status(503).json({ error: message, tried });
    }

    cache.set(cacheKey, { ...result, expiresAt: now + CACHE_TTL_MS });
    return res.status(200).json({ ...result, cached: false });
  } catch (err) {
    console.error("[image] handler error:", err);
    return res
      .status(err?.status || 500)
      .json({ error: String(err?.message || err) });
  }
}

// ─── Vecteezy ────────────────────────────────────────────────────────
// Best-effort integration: Vecteezy's Content API typically expects a
// Bearer token and returns a list of resources under `resources` or
// `data`. Each resource exposes preview URLs in different field names
// across plan tiers (`preview_url`, `thumbnail.large`, `urls.preview`,
// etc.), so the picker below tries a few common paths in order.
//
// If your key works but the API returns a shape this code can't parse,
// log the raw response (uncomment the console.log line) and tell the
// assistant — adding another path takes one line.
const VECTEEZY_BASE =
  process.env.VECTEEZY_API_BASE || "https://api.vecteezy.com/v2";

async function fetchFromVecteezy(query) {
  const url = `${VECTEEZY_BASE}/resources?content_type=photo&per_page=10&query=${encodeURIComponent(query)}`;
  const r = await fetch(url, {
    headers: {
      Authorization: `Bearer ${process.env.VECTEEZY_API_KEY}`,
      Accept: "application/json",
    },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Vecteezy ${r.status}: ${text.slice(0, 160)}`);
  }
  const data = await r.json();
  // console.log("[image] Vecteezy raw:", JSON.stringify(data).slice(0, 400));

  const list = data?.resources || data?.data || data?.results || [];
  const first = list[0];
  if (!first) throw new Error("Vecteezy: no results");

  const url2 =
    first.preview_url ||
    first.thumbnail?.large ||
    first.thumbnail?.large_url ||
    first.urls?.preview ||
    first.urls?.large ||
    first.image?.preview ||
    first.image?.large ||
    null;
  if (!url2) throw new Error("Vecteezy: result had no preview URL we recognise");

  const credit = {
    name:
      first.contributor?.name ||
      first.user?.name ||
      first.author?.name ||
      "Vecteezy contributor",
    url:
      first.contributor?.profile_url ||
      first.user?.profile_url ||
      first.permalink ||
      "https://www.vecteezy.com",
  };
  return { url: url2, source: "vecteezy", credit };
}

// ─── Pexels ──────────────────────────────────────────────────────────
// Pexels search API returns multiple photos; we pick the first one with
// a reasonable aspect ratio (kindergarten slide is roughly square).
async function fetchFromPexels(query) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?per_page=8&orientation=square&query=${encodeURIComponent(query)}`,
    { headers: { Authorization: process.env.PEXELS_API_KEY } },
  );
  if (!r.ok) throw new Error(`Pexels ${r.status}`);
  const data = await r.json();
  const photo = data?.photos?.[0];
  if (!photo) throw new Error("Pexels: no results");
  return {
    url: photo.src?.large || photo.src?.medium || photo.src?.original,
    source: "pexels",
    credit: { name: photo.photographer, url: photo.photographer_url },
  };
}

// ─── Unsplash ────────────────────────────────────────────────────────
async function fetchFromUnsplash(query) {
  const r = await fetch(
    `https://api.unsplash.com/search/photos?per_page=8&orientation=squarish&query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`,
        "Accept-Version": "v1",
      },
    },
  );
  if (!r.ok) throw new Error(`Unsplash ${r.status}`);
  const data = await r.json();
  const photo = data?.results?.[0];
  if (!photo) throw new Error("Unsplash: no results");
  return {
    url: photo.urls?.regular || photo.urls?.small,
    source: "unsplash",
    credit: { name: photo.user?.name, url: photo.user?.links?.html },
  };
}
