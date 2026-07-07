import { useCallback, useEffect, useRef, useState } from "react";

const FATAL_ERRORS = new Set(["not-allowed", "audio-capture", "service-not-allowed"]);

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

  // Chrome silently ends a `continuous` recognition session after a few
  // seconds of silence (fires `no-speech` then `onend`) even though the
  // caller never asked it to stop — which used to kill the mic right as
  // the child paused to think before answering. `manualStopRef` tracks
  // whether WE asked for the stop (via stop()/abort()) so onend can tell
  // the difference and auto-restart everywhere else. Fatal errors (denied
  // mic permission, no mic hardware) are excluded so we don't loop forever.
  const manualStopRef = useRef(false);
  const lastErrorRef = useRef(null);
  const startRef = useRef(() => {});

  const start = useCallback(() => {
    if (!supported || listening) return;
    manualStopRef.current = false;
    lastErrorRef.current = null;
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
        lastErrorRef.current = e?.error || "unknown";
        setError(lastErrorRef.current);
      };
      rec.onend = () => {
        setListening(false);
        if (
          continuous &&
          !manualStopRef.current &&
          !FATAL_ERRORS.has(lastErrorRef.current)
        ) {
          setTimeout(() => {
            if (!manualStopRef.current) startRef.current();
          }, 250);
        }
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

  useEffect(() => {
    startRef.current = start;
  }, [start]);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore — already stopped
      }
    }
  }, []);

  const abort = useCallback(() => {
    manualStopRef.current = true;
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
