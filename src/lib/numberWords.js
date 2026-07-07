// Shared digit <-> spoken-word helper for 0-20 — used by the equation
// visuals (to display "seven" under a numeral) and by the Lesson quiz
// flow (to phrase a question and recognize the spoken answer).
export const NUMBER_WORDS = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight",
  "nine", "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen",
  "sixteen", "seventeen", "eighteen", "nineteen", "twenty",
];

export function numberWord(n) {
  return NUMBER_WORDS[n] ?? String(n);
}
