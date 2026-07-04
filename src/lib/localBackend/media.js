// Browser port of api/image.js + api/images.js + api/video.js. Fetches
// real stock photos/videos directly from the provider APIs using the
// VITE_-prefixed keys baked into the build. In-memory cache only (resets
// on page reload — the old server cache doesn't carry over).

const singleCache = new Map();
const multiCache = new Map();
const videoCache = new Map();
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

function env(key) {
  return import.meta.env[key];
}

export async function image({ word, hint }) {
  if (!word || typeof word !== "string") {
    return { status: 400, body: { error: "word (string) required" } };
  }

  const query = (hint || word).trim();
  const cacheKey = `${word.trim().toLowerCase()}::${hint || ""}`;
  const now = Date.now();
  const hit = singleCache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return { status: 200, body: { url: hit.url, source: hit.source, credit: hit.credit, cached: true } };
  }

  const tried = [];
  let result = null;

  if (env("VITE_VECTEEZY_API_KEY")) {
    try {
      result = await fetchFromVecteezy(query);
    } catch (e) {
      tried.push({ provider: "vecteezy", error: e.message });
    }
  }
  if (!result && env("VITE_PEXELS_API_KEY")) {
    try {
      result = await fetchFromPexels(query);
    } catch (e) {
      tried.push({ provider: "pexels", error: e.message });
    }
  }
  if (!result && env("VITE_UNSPLASH_ACCESS_KEY")) {
    try {
      result = await fetchFromUnsplash(query);
    } catch (e) {
      tried.push({ provider: "unsplash", error: e.message });
    }
  }

  if (!result) {
    const message = tried.length
      ? `All photo providers failed: ${tried.map((t) => `${t.provider}(${t.error})`).join("; ")}`
      : "No photo provider configured. Add VITE_VECTEEZY_API_KEY, VITE_PEXELS_API_KEY, or VITE_UNSPLASH_ACCESS_KEY to .env and restart.";
    return { status: 503, body: { error: message, tried } };
  }

  singleCache.set(cacheKey, { ...result, expiresAt: now + CACHE_TTL_MS });
  return { status: 200, body: { ...result, cached: false } };
}

export async function images({ word, hint, count }) {
  if (!word || typeof word !== "string") {
    return { status: 400, body: { error: "word (string) required" } };
  }
  const want = Math.min(12, Math.max(1, Number(count) || 6));

  const query = (hint || word).trim();
  const cacheKey = `${word.trim().toLowerCase()}::${hint || ""}::${want}`;
  const now = Date.now();
  const hit = multiCache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return { status: 200, body: { photos: hit.payload, cached: true } };
  }

  if (!env("VITE_PEXELS_API_KEY")) {
    return { status: 503, body: { error: "VITE_PEXELS_API_KEY missing — required for photo sets." } };
  }

  const r = await fetch(
    `https://api.pexels.com/v1/search?per_page=${want}&orientation=square&query=${encodeURIComponent(query)}`,
    { headers: { Authorization: env("VITE_PEXELS_API_KEY") } },
  );
  if (!r.ok) {
    return { status: r.status, body: { error: `Pexels ${r.status}` } };
  }
  const data = await r.json();
  const photos = (data?.photos || [])
    .map((p) => ({
      url: p.src?.large || p.src?.medium || p.src?.original,
      thumb: p.src?.medium || p.src?.small,
      credit: { name: p.photographer, url: p.photographer_url },
    }))
    .filter((p) => p.url);

  if (!photos.length) {
    return { status: 404, body: { error: `Pexels: no photos for "${query}"` } };
  }

  multiCache.set(cacheKey, { payload: photos, expiresAt: now + CACHE_TTL_MS });
  return { status: 200, body: { photos, cached: false } };
}

export async function video({ word, hint }) {
  if (!word || typeof word !== "string") {
    return { status: 400, body: { error: "word (string) required" } };
  }

  const query = (hint || word).trim();
  const cacheKey = `${word.trim().toLowerCase()}::${hint || ""}`;
  const now = Date.now();
  const hit = videoCache.get(cacheKey);
  if (hit && hit.expiresAt > now) {
    return { status: 200, body: { ...hit.payload, cached: true } };
  }

  if (!env("VITE_PEXELS_API_KEY")) {
    return { status: 503, body: { error: "VITE_PEXELS_API_KEY missing — required for video." } };
  }

  const r = await fetch(
    `https://api.pexels.com/videos/search?per_page=20&orientation=square&size=small&query=${encodeURIComponent(query)}`,
    { headers: { Authorization: env("VITE_PEXELS_API_KEY") } },
  );
  if (!r.ok) {
    return { status: r.status, body: { error: `Pexels ${r.status}` } };
  }
  const data = await r.json();
  const candidates = data?.videos || [];
  if (!candidates.length) {
    return { status: 404, body: { error: `Pexels: no video for "${query}"` } };
  }

  const strictWord = (word || "").trim().toLowerCase();
  const hintWords = (query || "")
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length >= 3 && w !== strictWord);

  function score(v) {
    const slug = (v.url || "").toLowerCase();
    if (!strictWord || !slug.includes(strictWord)) return -1;
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
    return { status: 404, body: { error: `Pexels: no relevant video for "${strictWord}"` } };
  }
  const best = ranked[0].v;

  const files = (best.video_files || [])
    .filter((f) => f.file_type === "video/mp4")
    .sort((a, b) => (a.width || 0) - (b.width || 0));
  const pick = files.find((f) => (f.width || 0) >= 360 && (f.width || 0) <= 720) || files[0];
  if (!pick?.link) {
    return { status: 404, body: { error: "Pexels: no playable mp4 found" } };
  }

  const payload = {
    url: pick.link,
    width: pick.width,
    height: pick.height,
    source: "pexels",
    credit: { name: best.user?.name, url: best.user?.url },
    pexelsPage: best.url,
  };
  videoCache.set(cacheKey, { payload, expiresAt: now + CACHE_TTL_MS });
  return { status: 200, body: { ...payload, cached: false } };
}

async function fetchFromVecteezy(query) {
  const base = env("VITE_VECTEEZY_API_BASE") || "https://api.vecteezy.com/v2";
  const url = `${base}/resources?content_type=photo&per_page=10&query=${encodeURIComponent(query)}`;
  const r = await fetch(url, {
    headers: { Authorization: `Bearer ${env("VITE_VECTEEZY_API_KEY")}`, Accept: "application/json" },
  });
  if (!r.ok) {
    const text = await r.text().catch(() => "");
    throw new Error(`Vecteezy ${r.status}: ${text.slice(0, 160)}`);
  }
  const data = await r.json();
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
    name: first.contributor?.name || first.user?.name || first.author?.name || "Vecteezy contributor",
    url: first.contributor?.profile_url || first.user?.profile_url || first.permalink || "https://www.vecteezy.com",
  };
  return { url: url2, source: "vecteezy", credit };
}

async function fetchFromPexels(query) {
  const r = await fetch(
    `https://api.pexels.com/v1/search?per_page=8&orientation=square&query=${encodeURIComponent(query)}`,
    { headers: { Authorization: env("VITE_PEXELS_API_KEY") } },
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

async function fetchFromUnsplash(query) {
  const r = await fetch(
    `https://api.unsplash.com/search/photos?per_page=8&orientation=squarish&query=${encodeURIComponent(query)}`,
    { headers: { Authorization: `Client-ID ${env("VITE_UNSPLASH_ACCESS_KEY")}`, "Accept-Version": "v1" } },
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
