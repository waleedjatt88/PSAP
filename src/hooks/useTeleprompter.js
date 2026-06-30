import { useCallback, useEffect, useRef, useState } from "react";

// Sentence-by-sentence speech engine with an "active sentence" index
// so the page can highlight the line being spoken.
//
// Audio source resolution chain (per sentence):
//   1. Server TTS at POST /api/tts  (OpenAI tts-1-hd or ElevenLabs)
//      → returns mp3, played via <audio>.
//   2. Browser Web Speech API (`speechSynthesis`) — fallback.
//
// The first time /api/tts returns a non-200 we remember it and stop
// trying for the rest of the session, so we don't hammer a broken
// endpoint sentence after sentence.
//
// State machine: idle → playing ⇄ paused → (back to playing or idle).
export default function useTeleprompter(sentences, options = {}) {
  const supported =
    typeof window !== "undefined" &&
    ("speechSynthesis" in window || true); // server TTS works even without speechSynthesis

  const {
    preferredGender = "any",
    classLevel,
  } = options;

  const [state, setState] = useState("idle"); // 'idle' | 'playing' | 'paused'
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [rate, setRate] = useState(1);
  const [audioBackend, setAudioBackend] = useState("auto"); // 'auto' | 'server' | 'web'

  // Generation counter — every restart bumps it; stale callbacks ignore.
  const genRef = useRef(0);
  const rateRef = useRef(rate);
  const classLevelRef = useRef(classLevel);
  const genderRef = useRef(preferredGender);
  const serverTtsBrokenRef = useRef(false);
  const audioElRef = useRef(null);

  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);
  useEffect(() => {
    classLevelRef.current = classLevel;
  }, [classLevel]);
  useEffect(() => {
    genderRef.current = preferredGender;
  }, [preferredGender]);

  const sentencesRef = useRef(sentences);
  useEffect(() => {
    sentencesRef.current = sentences;
  }, [sentences]);

  // ── Web Speech voice picker (fallback) ──────────────────────────────
  const pickVoice = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;

    const isFemale = genderRef.current === "female";
    const isMale = genderRef.current === "male";
    const female =
      /female|ezinne|aria|jenny|libby|sonia|maisie|hazel|samantha|zira|salma|natasha|emma|olivia/i;
    const male =
      /male|abeo|guy|davis|david|ryan|james|brian|mark|tony|george|daniel|william/i;
    const matches = (v) => {
      if (isFemale)
        return female.test(v.name) && !/male/i.test(v.name.replace(/female/i, ""));
      if (isMale) return male.test(v.name) && !female.test(v.name);
      return true;
    };
    const inTier = (re) => {
      const tier = voices.filter((v) => re.test(v.lang));
      if (!tier.length) return null;
      return tier.find(matches) || (genderRef.current === "any" ? tier[0] : null);
    };
    return (
      inTier(/en[-_]?NG/i) ||
      inTier(/en[-_]?(ZA|KE|GH)/i) ||
      inTier(/en[-_]?GB/i) ||
      inTier(/en[-_]?US/i) ||
      inTier(/^en/i) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0]
    );
  }, []);

  // ── Server TTS playback ─────────────────────────────────────────────
  // Returns a Promise that resolves when audio finishes (or rejects).
  async function speakViaServer(text) {
    const r = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        classLevel: classLevelRef.current,
        gender: genderRef.current,
        speed: rateRef.current,
      }),
    });
    if (!r.ok) throw new Error(`TTS ${r.status}`);
    const blob = await r.blob();
    const url = URL.createObjectURL(blob);
    const audio = new Audio(url);
    audioElRef.current = audio;
    return new Promise((resolve, reject) => {
      audio.addEventListener("ended", () => {
        URL.revokeObjectURL(url);
        resolve();
      });
      audio.addEventListener("error", (e) => {
        URL.revokeObjectURL(url);
        reject(e);
      });
      audio.play().catch(reject);
    });
  }

  // ── Web Speech playback ─────────────────────────────────────────────
  function speakViaWebSpeech(text) {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return Promise.reject(new Error("web speech not supported"));
    }
    return new Promise((resolve, reject) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = rateRef.current * (
        // Bump down further for Kindergarten on the slower Web Speech engine.
        /kindergart|nursery/i.test(String(classLevelRef.current || "")) ? 0.9 : 1
      );
      u.pitch = genderRef.current === "female" ? 1.1 : 0.95;
      const v = pickVoice();
      if (v) u.voice = v;
      u.onend = () => resolve();
      u.onerror = (e) => reject(e);
      window.speechSynthesis.speak(u);
    });
  }

  async function speakOne(text) {
    // Try server TTS first unless we've already learned it's broken.
    if (audioBackend !== "web" && !serverTtsBrokenRef.current) {
      try {
        await speakViaServer(text);
        if (audioBackend === "auto") setAudioBackend("server");
        return;
      } catch (err) {
        // First failure: lock the backend to "web" for the rest of the
        // session so we don't slow down every subsequent sentence with
        // another failed network roundtrip.
        serverTtsBrokenRef.current = true;
        setAudioBackend("web");
        console.warn(
          "[teleprompter] server TTS unavailable, falling back to browser voice:",
          err?.message || err,
        );
      }
    }
    await speakViaWebSpeech(text);
  }

  const speakFrom = useCallback((startIdx) => {
    if (!supported) return;
    // Cancel anything in flight.
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
      } catch {
        /* ignore */
      }
      audioElRef.current = null;
    }
    const myGen = ++genRef.current;
    let idx = startIdx;

    const tick = async () => {
      if (genRef.current !== myGen) return;
      const list = sentencesRef.current;
      if (idx >= list.length) {
        setState("idle");
        return;
      }
      setCurrentIdx(idx);
      setState("playing");
      try {
        await speakOne(list[idx]);
      } catch (err) {
        if (genRef.current !== myGen) return;
        console.warn("[teleprompter] sentence failed:", err?.message || err);
        // Try to keep going on the next sentence rather than stalling.
      }
      if (genRef.current !== myGen) return;
      idx += 1;
      tick();
    };
    tick();
  }, [supported, audioBackend]);

  const play = useCallback(() => {
    if (state === "paused" && currentIdx >= 0) {
      speakFrom(currentIdx);
    } else {
      speakFrom(0);
    }
  }, [state, currentIdx, speakFrom]);

  const pause = useCallback(() => {
    if (!supported) return;
    genRef.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
      } catch {
        /* ignore */
      }
    }
    setState("paused");
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    genRef.current++;
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (audioElRef.current) {
      try {
        audioElRef.current.pause();
      } catch {
        /* ignore */
      }
      audioElRef.current = null;
    }
    setState("idle");
    setCurrentIdx(-1);
  }, [supported]);

  const jumpTo = useCallback(
    (idx) => {
      if (idx < 0 || idx >= sentencesRef.current.length) return;
      speakFrom(idx);
    },
    [speakFrom],
  );

  // Stop everything on unmount.
  useEffect(
    () => () => {
      genRef.current++;
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      if (audioElRef.current) {
        try {
          audioElRef.current.pause();
        } catch {
          /* ignore */
        }
      }
    },
    [],
  );

  return {
    supported,
    state,
    currentIdx,
    rate,
    setRate,
    play,
    pause,
    stop,
    jumpTo,
    total: sentences.length,
    backend: audioBackend, // 'auto' | 'server' | 'web'
  };
}
