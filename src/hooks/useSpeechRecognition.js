import { useCallback, useEffect, useRef, useState } from "react";

// Thin wrapper around the Web Speech Recognition API.
// Works in Chrome, Edge, and Safari. Not yet in Firefox.
//
// Usage:
//   const sr = useSpeechRecognition({
//     continuous: false,           // false = one-shot dictation
//     interimResults: true,        // stream partial words while user is talking
//     onResult: (finalText) => {}, // fires when the user pauses
//     onCommand: (text) => {},     // optional — fires for every interim+final result, used for command keywords
//   });
//
//   sr.start() / sr.stop() / sr.supported / sr.listening / sr.transcript
export default function useSpeechRecognition({
  continuous = false,
  interimResults = true,
  lang = "en-US",
  onResult,
  onCommand,
} = {}) {
  const SR =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null;
  const supported = Boolean(SR);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  // Keep stable callback refs so the recognition instance survives renders.
  const onResultRef = useRef(onResult);
  const onCommandRef = useRef(onCommand);
  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);
  useEffect(() => {
    onCommandRef.current = onCommand;
  }, [onCommand]);

  const start = useCallback(() => {
    if (!supported || listening) return;
    try {
      const rec = new SR();
      rec.continuous = continuous;
      rec.interimResults = interimResults;
      rec.lang = lang;

      rec.onstart = () => {
        setListening(true);
        setError(null);
        setTranscript("");
      };
      rec.onerror = (e) => {
        setError(e?.error || "unknown");
        setListening(false);
      };
      rec.onend = () => {
        setListening(false);
      };
      rec.onresult = (event) => {
        let finalText = "";
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalText += t;
          else interim += t;
        }
        const combined = (finalText || interim).trim();
        setTranscript(combined);
        if (onCommandRef.current) onCommandRef.current(combined.toLowerCase());
        if (finalText && onResultRef.current) {
          onResultRef.current(finalText.trim());
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      setError(String(e?.message || e));
      setListening(false);
    }
  }, [SR, continuous, interimResults, lang, listening, supported]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore — already stopped
      }
    }
  }, []);

  const abort = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // ignore
      }
    }
    setListening(false);
  }, []);

  useEffect(() => () => abort(), [abort]);

  return { supported, listening, transcript, error, start, stop, abort };
}
