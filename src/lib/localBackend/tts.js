// Browser port of api/tts.js. Returns { status, blob } for success (audio/mpeg)
// or { status, body } (JSON) on failure, so the router can build the right
// kind of Response. If no key is configured, the caller (useTeleprompter)
// already falls back to the browser's built-in speechSynthesis voice.

const OPENAI_DEFAULT_VOICES = {
  Kindergarten: "shimmer",
  Nursery: "shimmer",
  "Primary 1": "shimmer",
  "Primary 2": "shimmer",
  "Primary 3": "nova",
  default: "nova",
  male: "onyx",
  female: "nova",
};

const ELEVENLABS_DEFAULT_VOICES = {
  male: "TX3LPaxmHKxFdv7VOQHJ",
  female: "21m00Tcm4TlvDq8ikWAM",
  Kindergarten: "AZnzlk1XvdvUeBnXmlld",
  default: "21m00Tcm4TlvDq8ikWAM",
};

function env(key) {
  return import.meta.env[key];
}

function inferSpeed(classLevel, override) {
  if (typeof override === "number" && override > 0) return override;
  if (!classLevel) return 0.95;
  const c = String(classLevel).toLowerCase();
  if (c.includes("kindergart") || c.includes("nursery")) return 0.8;
  if (c.includes("primary")) return 0.88;
  return 0.95;
}

function addPauses(text) {
  return text.replace(/([.!?])\s+/g, "$1  ").replace(/,\s+/g, ", ");
}

export async function tts({ text, voice, speed, classLevel, gender, provider: providerOverride }) {
  if (!text || typeof text !== "string") {
    return { status: 400, body: { error: "Missing `text`" } };
  }

  const provider = (providerOverride || env("VITE_TTS_PROVIDER") || "openai").toLowerCase();
  const inferredSpeed = inferSpeed(classLevel, speed);
  const spokenText = addPauses(text);

  if (provider === "elevenlabs") {
    const key = env("VITE_ELEVENLABS_API_KEY");
    if (!key) {
      return {
        status: 501,
        body: { error: "VITE_ELEVENLABS_API_KEY not configured — falling back to the browser voice." },
      };
    }
    const voiceId =
      voice || env("VITE_ELEVENLABS_VOICE_ID") || ELEVENLABS_DEFAULT_VOICES[gender] || ELEVENLABS_DEFAULT_VOICES.default;
    const model = env("VITE_ELEVENLABS_MODEL") || "eleven_turbo_v2_5";

    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`, {
      method: "POST",
      headers: { "xi-api-key": key, "Content-Type": "application/json", Accept: "audio/mpeg" },
      body: JSON.stringify({
        text: spokenText,
        model_id: model,
        voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true },
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      return { status: r.status, body: { error: errText } };
    }
    return { status: 200, blob: await r.blob() };
  }

  const key = env("VITE_OPENAI_API_KEY");
  if (!key) {
    return {
      status: 501,
      body: { error: "VITE_OPENAI_API_KEY not configured — falling back to the browser voice." },
    };
  }
  const model = env("VITE_OPENAI_TTS_MODEL") || "tts-1-hd";
  const v = voice || env("VITE_OPENAI_TTS_VOICE") || OPENAI_DEFAULT_VOICES[classLevel] || OPENAI_DEFAULT_VOICES[gender] || OPENAI_DEFAULT_VOICES.default;

  const r = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model, voice: v, input: spokenText, response_format: "mp3", speed: inferredSpeed }),
  });
  if (!r.ok) {
    const errText = await r.text();
    return { status: r.status, body: { error: errText } };
  }
  return { status: 200, blob: await r.blob() };
}
