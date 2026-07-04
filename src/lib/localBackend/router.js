// Patches window.fetch so every `/api/*` call already scattered across the
// app (Lesson.jsx, Homework.jsx, AskAIModal.jsx, useTeleprompter.js,
// useWordPhoto.js, LetterPhotoScene.jsx, src/lib/authApi.js) keeps working
// completely unchanged, but now resolves entirely in the browser instead
// of hitting a Vercel/Express server. This is what lets us delete the
// whole Node backend without touching call sites.
import * as auth from "./auth.js";
import { chat } from "./chat.js";
import { grade } from "./grade.js";
import { lesson } from "./lesson.js";
import { image, images, video } from "./media.js";
import { tts } from "./tts.js";
import { report } from "./report.js";
import { getProviderConfig } from "./aiProvider.js";

function headerValue(init, name) {
  const h = init?.headers;
  if (!h) return null;
  if (typeof Headers !== "undefined" && h instanceof Headers) return h.get(name);
  if (Array.isArray(h)) {
    const found = h.find(([k]) => k.toLowerCase() === name.toLowerCase());
    return found ? found[1] : null;
  }
  const key = Object.keys(h).find((k) => k.toLowerCase() === name.toLowerCase());
  return key ? h[key] : null;
}

function parseBody(init) {
  if (!init?.body) return {};
  try {
    return JSON.parse(init.body);
  } catch {
    return {};
  }
}

function jsonResponse(status, body) {
  return new Response(JSON.stringify(body ?? {}), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

// Every route handler resolves to { status, body } (JSON) except /api/tts,
// which resolves to { status, blob } and is special-cased below. Auth
// handlers may throw instead of returning — caught uniformly here so the
// error shape matches what the old server sent (message + any extra
// fields like `needsVerification`).
async function runHandler(fn) {
  try {
    return await fn();
  } catch (e) {
    const { status, ...extra } = e;
    return { status: status || 500, body: { error: e.message || "Request failed", ...extra } };
  }
}

const ROUTES = {
  "POST /api/auth/signup": (req) => auth.signup(req.body),
  "POST /api/auth/login": (req) => auth.login(req.body),
  "GET /api/auth/me": (req) => auth.me(req),
  "POST /api/auth/update-profile": (req) => auth.updateProfile(req),
  "POST /api/auth/resend-otp": (req) => auth.resendOtp(req.body),
  "POST /api/auth/verify-otp": (req) => auth.verifyOtp(req.body),
  "POST /api/auth/forgot-password": (req) => auth.forgotPassword(req.body),
  "POST /api/auth/reset-password": (req) => auth.resetPassword(req.body),
  "POST /api/chat": (req) => chat(req.body),
  "POST /api/grade": (req) => grade(req.body),
  "POST /api/lesson": (req) => lesson(req.body),
  "POST /api/image": (req) => image(req.body),
  "POST /api/images": (req) => images(req.body),
  "POST /api/video": (req) => video(req.body),
  "POST /api/report": (req) => report(req.body),
  "GET /api/health": () => {
    const cfg = getProviderConfig();
    return { status: 200, body: { ok: true, provider: cfg.name, model: cfg.model, hasKey: Boolean(cfg.apiKey), runtime: "browser" } };
  },
};

async function handleLocalApi(pathname, method, init) {
  if (pathname === "/api/tts" && method === "POST") {
    const result = await runHandler(() => tts(parseBody(init)));
    if (result.blob) {
      return new Response(result.blob, { status: result.status, headers: { "Content-Type": "audio/mpeg" } });
    }
    return jsonResponse(result.status, result.body);
  }

  const handler = ROUTES[`${method} ${pathname}`];
  if (!handler) return jsonResponse(404, { error: `No local handler for ${method} ${pathname}` });

  const req = { body: parseBody(init), headers: { Authorization: headerValue(init, "Authorization") } };
  const result = await runHandler(() => handler(req));
  return jsonResponse(result.status, result.body);
}

let installed = false;

export function installLocalApi() {
  if (installed) return;
  installed = true;
  auth.ensureDemoUser();
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function (input, init) {
    const url = typeof input === "string" ? input : input?.url || "";
    if (url.startsWith("/api/")) {
      const method = (init?.method || (typeof input === "object" && input.method) || "GET").toUpperCase();
      return handleLocalApi(url, method, init);
    }
    return originalFetch(input, init);
  };
}
