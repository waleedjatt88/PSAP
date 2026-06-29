import { useCallback, useEffect, useRef, useState } from "react";

// Drives sentence-by-sentence speech synthesis with an "active sentence"
// index so the page can highlight the line currently being spoken.
// State machine: idle → playing ⇄ paused → (back to playing or idle).
//
// Sentence-level (rather than word-level via `onboundary`) was chosen
// because `onboundary` is unreliable across browsers — especially after
// pause/resume. Speaking one sentence per utterance gives us perfect
// per-sentence sync and crisp pause behavior.
export default function useTeleprompter(sentences) {
  const supported =
    typeof window !== "undefined" && "speechSynthesis" in window;

  const [state, setState] = useState("idle"); // 'idle' | 'playing' | 'paused'
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [rate, setRate] = useState(1);

  // A monotonically increasing generation counter — every time the
  // teleprompter is restarted, the generation bumps. Any stale onend
  // callback from a prior generation is ignored.
  const genRef = useRef(0);
  const rateRef = useRef(rate);
  useEffect(() => {
    rateRef.current = rate;
  }, [rate]);

  const sentencesRef = useRef(sentences);
  useEffect(() => {
    sentencesRef.current = sentences;
  }, [sentences]);

  // Voice selection — prefer Nigerian English first, then UK/US natural voices.
  // Microsoft Edge ships "Microsoft Ezinne (en-NG)" and "Microsoft Abeo (en-NG)"
  // which sound noticeably more natural to a Nigerian student.
  const pickVoice = useCallback(() => {
    if (!supported) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    return (
      // 1. Nigerian English, any name
      voices.find((v) => /en[-_]?NG/i.test(v.lang)) ||
      // 2. African accent fallback (some browsers expose en-ZA)
      voices.find((v) => /en[-_]?(ZA|KE|GH)/i.test(v.lang)) ||
      // 3. UK English natural voice
      voices.find(
        (v) =>
          /en[-_]?GB/i.test(v.lang) &&
          /natural|aria|libby|sonia|maisie|hazel/i.test(v.name),
      ) ||
      // 4. US natural female voice
      voices.find(
        (v) =>
          /en[-_]?US/i.test(v.lang) &&
          /natural|jenny|aria|samantha|female/i.test(v.name),
      ) ||
      // 5. Any English Google/Microsoft voice
      voices.find(
        (v) => /^en/i.test(v.lang) && /google|microsoft/i.test(v.name),
      ) ||
      // 6. Any English voice
      voices.find((v) => /^en/i.test(v.lang)) ||
      voices[0]
    );
  }, [supported]);

  const speakFrom = useCallback(
    (startIdx) => {
      if (!supported) return;
      window.speechSynthesis.cancel();
      const myGen = ++genRef.current;
      let idx = startIdx;

      const tick = () => {
        if (genRef.current !== myGen) return;
        const list = sentencesRef.current;
        if (idx >= list.length) {
          setState("idle");
          return;
        }
        setCurrentIdx(idx);
        setState("playing");
        const u = new SpeechSynthesisUtterance(list[idx]);
        u.rate = rateRef.current;
        u.pitch = 1.05;
        u.lang = "en-US";
        const v = pickVoice();
        if (v) u.voice = v;
        u.onend = () => {
          if (genRef.current !== myGen) return;
          idx += 1;
          tick();
        };
        u.onerror = () => {
          if (genRef.current !== myGen) return;
          setState("idle");
        };
        window.speechSynthesis.speak(u);
      };

      tick();
    },
    [supported, pickVoice],
  );

  const play = useCallback(() => {
    if (state === "paused" && currentIdx >= 0) {
      speakFrom(currentIdx);
    } else {
      speakFrom(0);
    }
  }, [state, currentIdx, speakFrom]);

  const pause = useCallback(() => {
    if (!supported) return;
    genRef.current++; // invalidate any in-flight onend
    window.speechSynthesis.cancel();
    setState("paused");
  }, [supported]);

  const stop = useCallback(() => {
    if (!supported) return;
    genRef.current++;
    window.speechSynthesis.cancel();
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

  // Stop any speech if the component using this hook unmounts (e.g. when
  // navigating to a different lesson).
  useEffect(
    () => () => {
      genRef.current++;
      if (supported) window.speechSynthesis.cancel();
    },
    [supported],
  );

  return {
    supported,
    state, // 'idle' | 'playing' | 'paused'
    currentIdx,
    rate,
    setRate,
    play,
    pause,
    stop,
    jumpTo,
    total: sentences.length,
  };
}
