import { useRef } from "react";

// Six individual digit boxes instead of one text field — the standard OTP
// pattern (auto-advance on type, backspace to go back, paste a full code
// into any box).
export default function OtpInput({ length = 6, value, onChange, autoFocus = true }) {
  const inputsRef = useRef([]);
  const digits = value.padEnd(length, " ").split("").slice(0, length);

  const setDigit = (index, char) => {
    const next = value.split("");
    next[index] = char;
    onChange(next.join("").slice(0, length));
  };

  const handleChange = (index, e) => {
    const raw = e.target.value.replace(/\D/g, "");
    if (!raw) {
      setDigit(index, "");
      return;
    }
    // Handles both a single keystroke and a full code typed/autofilled
    // into one box.
    const chars = raw.split("");
    let next = value.split("");
    let cursor = index;
    for (const ch of chars) {
      if (cursor >= length) break;
      next[cursor] = ch;
      cursor += 1;
    }
    onChange(next.join("").slice(0, length));
    const focusIndex = Math.min(cursor, length - 1);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digits[index].trim() && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (index, e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    const next = value.split("");
    let cursor = index;
    for (const ch of pasted) {
      if (cursor >= length) break;
      next[cursor] = ch;
      cursor += 1;
    }
    onChange(next.join("").slice(0, length));
    inputsRef.current[Math.min(cursor, length - 1)]?.focus();
  };

  return (
    <div className="flex justify-between gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => (inputsRef.current[i] = el)}
          value={digit.trim()}
          onChange={(e) => handleChange(i, e)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={(e) => handlePaste(i, e)}
          autoFocus={autoFocus && i === 0}
          inputMode="numeric"
          maxLength={1}
          className="w-full aspect-square min-w-0 bg-white/5 border border-white/10 text-white rounded-xl text-center text-2xl font-bold outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 transition-colors"
        />
      ))}
    </div>
  );
}
