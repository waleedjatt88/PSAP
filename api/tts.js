// POST /api/tts
//
// Returns audio (mp3) for the supplied text using a high-quality
// neural TTS provider. Provider is selected via TTS_PROVIDER env var
// (default: "openai"), and falls through to Web Speech in the browser
// if neither key is configured (handled client-side).
//
// Body:
//   {
//     text: string,
//     voice?: string,    // provider-specific voice id; defaults below
//     speed?: number,    // 0.5 - 1.5; default 1.0
//     classLevel?: string // for per-level defaults
//   }
//
// Env (any one of these unlocks high-quality voice):
//   TTS_PROVIDER          = "openai" | "elevenlabs"  (default: openai)
//   OPENAI_API_KEY        used for OpenAI TTS
//   OPENAI_TTS_MODEL      default: "tts-1-hd"
//   OPENAI_TTS_VOICE      default: "nova"      (also: shimmer, alloy, fable, onyx, echo)
//   ELEVENLABS_API_KEY    used for ElevenLabs
//   ELEVENLABS_VOICE_ID   default: "21m00Tcm4TlvDq8ikWAM" (Rachel — warm female)
//   ELEVENLABS_MODEL      default: "eleven_turbo_v2_5"

const OPENAI_DEFAULT_VOICES = {
  "Kindergarten": "shimmer",  // bright, playful
  "Nursery": "shimmer",
  "Primary 1": "shimmer",
  "Primary 2": "shimmer",
  "Primary 3": "nova",
  default: "nova",            // warm, friendly
  male: "onyx",
  female: "nova",
};

const ELEVENLABS_DEFAULT_VOICES = {
  // Stable, known ElevenLabs voice IDs.
  male: "TX3LPaxmHKxFdv7VOQHJ",  // Liam
  female: "21m00Tcm4TlvDq8ikWAM", // Rachel
  Kindergarten: "AZnzlk1XvdvUeBnXmlld", // Domi — youthful
  default: "21m00Tcm4TlvDq8ikWAM",
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const {
      text,
      voice,
      speed,
      classLevel,
      gender,
      provider: providerOverride,
    } = req.body || {};

    if (!text || typeof text !== "string") {
      return res.status(400).json({ error: "Missing `text`" });
    }

    const provider = (providerOverride || process.env.TTS_PROVIDER || "openai").toLowerCase();

    // Per-class-level speed default: kindergarten reads slowest.
    const inferredSpeed = inferSpeed(classLevel, speed);

    // Preprocess text for natural pacing — convert "." into ". " (extra
    // pause) and "?" into "? ". OpenAI/ElevenLabs honour these.
    const spokenText = addPauses(text);

    if (provider === "elevenlabs") {
      const key = process.env.ELEVENLABS_API_KEY;
      if (!key) {
        return res.status(501).json({
          error:
            "ELEVENLABS_API_KEY not configured. Set it in .env, OR switch TTS_PROVIDER to openai, OR omit /api/tts entirely — the client will fall back to the built-in browser voice.",
        });
      }
      const voiceId =
        voice ||
        process.env.ELEVENLABS_VOICE_ID ||
        ELEVENLABS_DEFAULT_VOICES[gender] ||
        ELEVENLABS_DEFAULT_VOICES.default;
      const model = process.env.ELEVENLABS_MODEL || "eleven_turbo_v2_5";

      const r = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
        {
          method: "POST",
          headers: {
            "xi-api-key": key,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text: spokenText,
            model_id: model,
            voice_settings: {
              stability: 0.45,
              similarity_boost: 0.75,
              style: 0.35,
              use_speaker_boost: true,
            },
          }),
        },
      );
      if (!r.ok) {
        const errText = await r.text();
        console.error("[tts/elevenlabs] error:", errText);
        return res.status(r.status).json({ error: errText });
      }
      const buf = Buffer.from(await r.arrayBuffer());
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("Cache-Control", "public, max-age=86400"); // 1 day
      return res.status(200).send(buf);
    }

    // Default: OpenAI TTS
    const key = process.env.OPENAI_API_KEY;
    if (!key) {
      return res.status(501).json({
        error:
          "OPENAI_API_KEY not configured. Set it in .env, OR set ELEVENLABS_API_KEY + TTS_PROVIDER=elevenlabs, OR omit /api/tts — the client will fall back to the browser's built-in voice.",
      });
    }
    const model = process.env.OPENAI_TTS_MODEL || "tts-1-hd";
    const v =
      voice ||
      process.env.OPENAI_TTS_VOICE ||
      OPENAI_DEFAULT_VOICES[classLevel] ||
      OPENAI_DEFAULT_VOICES[gender] ||
      OPENAI_DEFAULT_VOICES.default;

    const r = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        voice: v,
        input: spokenText,
        response_format: "mp3",
        speed: inferredSpeed,
      }),
    });
    if (!r.ok) {
      const errText = await r.text();
      console.error("[tts/openai] error:", errText);
      return res.status(r.status).json({ error: errText });
    }
    const buf = Buffer.from(await r.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "public, max-age=86400");
    return res.status(200).send(buf);
  } catch (err) {
    console.error("[tts] handler error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

function inferSpeed(classLevel, override) {
  if (typeof override === "number" && override > 0) return override;
  if (!classLevel) return 0.95;
  const c = String(classLevel).toLowerCase();
  if (c.includes("kindergart") || c.includes("nursery")) return 0.8;
  if (c.includes("primary")) return 0.88;
  if (c.includes("jss") || c.includes("ss")) return 0.95;
  return 0.95;
}

// Insert subtle punctuation pauses for more natural pacing. OpenAI's
// TTS already handles punctuation reasonably; ElevenLabs benefits more
// from these. We add an ellipsis after commas/periods so the model
// inserts a slightly longer breath.
function addPauses(text) {
  return text
    .replace(/([.!?])\s+/g, "$1  ")
    .replace(/,\s+/g, ", ");
}
