import { useEffect, useRef, useState } from "react";

// Fetches ONE real stock photo for `word` (optionally narrowed by `hint`)
// via /api/image — the same endpoint the kindergarten alphabet lesson
// uses for its letter flashcards. Kept separate from LetterPhotoScene's
// multi-photo carousel fetch since most scenes only need a single still.
export default function useWordPhoto(word, hint) {
  const [photo, setPhoto] = useState(null); // { url, credit }
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const requestedKey = useRef(null);

  useEffect(() => {
    if (!word) return;
    const key = `${word}::${hint || ""}`;
    if (requestedKey.current === key) return;
    requestedKey.current = key;
    setStatus("loading");
    setPhoto(null);

    fetch("/api/image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, hint }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (requestedKey.current !== key) return;
        if (!d?.url) {
          setStatus("error");
          return;
        }
        setPhoto({ url: d.url, credit: d.credit });
        setStatus("ready");
      })
      .catch(() => {
        if (requestedKey.current === key) setStatus("error");
      });
  }, [word, hint]);

  return { photo, status };
}
