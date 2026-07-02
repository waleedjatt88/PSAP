// Kindergarten — Numbers 1 to 20
// Each section shows ONE number gigantically alongside that many
// counting objects. Designed to be tappable + countable on screen.

const NUMBERS = [
  { n: 1, word: "One", emoji: "🍎", color: "from-rose-200 to-rose-100" },
  { n: 2, word: "Two", emoji: "🐶", color: "from-amber-200 to-amber-100" },
  { n: 3, word: "Three", emoji: "🌸", color: "from-pink-200 to-pink-100" },
  { n: 4, word: "Four", emoji: "🚗", color: "from-orange-200 to-orange-100" },
  { n: 5, word: "Five", emoji: "🐝", color: "from-yellow-200 to-yellow-100" },
  { n: 6, word: "Six", emoji: "🦋", color: "from-lime-200 to-lime-100" },
  { n: 7, word: "Seven", emoji: "⭐", color: "from-emerald-200 to-emerald-100" },
  { n: 8, word: "Eight", emoji: "🐠", color: "from-teal-200 to-teal-100" },
  { n: 9, word: "Nine", emoji: "🎈", color: "from-cyan-200 to-cyan-100" },
  { n: 10, word: "Ten", emoji: "🌟", color: "from-sky-200 to-sky-100" },
];

const sections = NUMBERS.map((item, i) => ({
  id: `number-${item.n}`,
  heading: `Number ${item.n}`,
  visual: { type: "kg-number", ...item },
  sentences: [
    `${item.word}.`,
    `This is the number ${item.n}.`,
    `Let's count. ${countingLine(item.n, item.emoji)}`,
    i < NUMBERS.length - 1
      ? `Wonderful! Next number is coming.`
      : `Amazing! You can count all the way to ten now.`,
  ],
}));

function countingLine(n, emoji) {
  return Array.from({ length: n })
    .map((_, i) => (i + 1).toString())
    .join(", ") + `. That's ${n}!`;
}

const numbersLesson = {
  id: "kg-numbers",
  subjectId: "kg-numeracy",
  subjectName: "Numbers",
  classLevel: "Kindergarten",
  topic: "Numbers 1 to 10",
  title: "Numbers 1 to 10",
  layout: "kindergarten",
  durationMinutes: 6,
  objectives: ["Count from 1 to 10", "Recognise each number on sight"],
  sections: [
    {
      id: "intro",
      heading: "Let's Count!",
      visual: { type: "kg-banner", icon: "🔢", label: "Counting 1 to 10", color: "from-blue-200 to-cyan-100", blocks: ["1", "2", "3"] },
      sentences: [
        "Hi friends!",
        "Today we are going to count from one to ten.",
        "Get ready to count out loud with me!",
      ],
    },
    ...sections,
    {
      id: "outro",
      heading: "You Did It!",
      visual: { type: "kg-banner", icon: "🎊", label: "1, 2, 3… 10!", color: "from-violet-200 to-purple-100", blocks: ["8", "9", "10"] },
      sentences: [
        "Brilliant!",
        "You counted from one all the way to ten.",
        "Give yourself a big clap!",
      ],
    },
  ],
};

export default numbersLesson;
