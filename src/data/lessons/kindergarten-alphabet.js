// Kindergarten — Alphabet A-Z
// Visual-heavy: every "section" is a single big letter scene.
// The slide layout for kind:"kindergarten" lessons takes over the
// screen with a huge animated letter + matching object.

const ALPHABET = [
  { letter: "A", word: "Apple", emoji: "🍎", color: "from-rose-200 to-rose-100" },
  { letter: "B", word: "Ball", emoji: "⚽", color: "from-amber-200 to-amber-100" },
  { letter: "C", word: "Cat", emoji: "🐱", color: "from-orange-200 to-orange-100" },
  { letter: "D", word: "Dog", emoji: "🐶", color: "from-yellow-200 to-yellow-100" },
  { letter: "E", word: "Elephant", emoji: "🐘", color: "from-lime-200 to-lime-100" },
  { letter: "F", word: "Fish", emoji: "🐟", color: "from-emerald-200 to-emerald-100" },
  { letter: "G", word: "Giraffe", emoji: "🦒", color: "from-teal-200 to-teal-100" },
  { letter: "H", word: "House", emoji: "🏠", color: "from-cyan-200 to-cyan-100" },
  { letter: "I", word: "Ice cream", emoji: "🍦", color: "from-sky-200 to-sky-100" },
  { letter: "J", word: "Jug", emoji: "🍯", color: "from-blue-200 to-blue-100" },
  { letter: "K", word: "Kite", emoji: "🪁", color: "from-indigo-200 to-indigo-100" },
  { letter: "L", word: "Lion", emoji: "🦁", color: "from-violet-200 to-violet-100" },
  { letter: "M", word: "Mango", emoji: "🥭", color: "from-purple-200 to-purple-100" },
  { letter: "N", word: "Nest", emoji: "🪺", color: "from-fuchsia-200 to-fuchsia-100" },
  { letter: "O", word: "Orange", emoji: "🍊", color: "from-pink-200 to-pink-100" },
  { letter: "P", word: "Pen", emoji: "✏️", color: "from-rose-200 to-rose-100" },
  { letter: "Q", word: "Queen", emoji: "👸", color: "from-amber-200 to-amber-100" },
  { letter: "R", word: "Rabbit", emoji: "🐰", color: "from-orange-200 to-orange-100" },
  { letter: "S", word: "Sun", emoji: "☀️", color: "from-yellow-200 to-yellow-100" },
  { letter: "T", word: "Tree", emoji: "🌳", color: "from-lime-200 to-lime-100" },
  { letter: "U", word: "Umbrella", emoji: "☂️", color: "from-emerald-200 to-emerald-100" },
  { letter: "V", word: "Van", emoji: "🚐", color: "from-teal-200 to-teal-100" },
  { letter: "W", word: "Whale", emoji: "🐋", color: "from-cyan-200 to-cyan-100" },
  { letter: "X", word: "Xylophone", emoji: "🎹", color: "from-sky-200 to-sky-100" },
  { letter: "Y", word: "Yam", emoji: "🍠", color: "from-blue-200 to-blue-100" },
  { letter: "Z", word: "Zebra", emoji: "🦓", color: "from-indigo-200 to-indigo-100" },
];

const sections = ALPHABET.map((item, i) => ({
  id: `letter-${item.letter}`,
  heading: `${item.letter} for ${item.word}`,
  visual: { type: "kg-letter", ...item },
  // Slow, deliberate, child-friendly narration
  sentences: [
    `${item.letter}.`,
    `${item.letter} is for ${item.word}.`,
    `Say it with me. ${item.word}.`,
    i === 0
      ? `Now let's clap. ${item.letter}, ${item.letter}, ${item.letter}!`
      : `Great job! Let's move to the next letter.`,
  ],
}));

const alphabetLesson = {
  id: "kg-alphabet",
  subjectId: "kg-literacy",
  subjectName: "Letters",
  classLevel: "Kindergarten",
  topic: "A to Z Alphabet",
  title: "A to Z Alphabet",
  layout: "kindergarten", // tells the lesson page to use the playful slide
  durationMinutes: 8,
  objectives: ["Recognise every letter from A to Z", "Match each letter to a familiar object"],
  sections: [
    {
      id: "intro",
      heading: "Welcome to ABC!",
      visual: { type: "kg-banner", icon: "🎉", label: "Let's learn the ABC!", color: "from-fuchsia-200 to-pink-100" },
      sentences: [
        "Hello little stars!",
        "Today we will learn the alphabet.",
        "Are you ready? Let's begin!",
      ],
    },
    ...sections,
    {
      id: "outro",
      heading: "Well done!",
      visual: { type: "kg-banner", icon: "🌟", label: "You learned A to Z!", color: "from-amber-200 to-yellow-100" },
      sentences: [
        "Wow, you did it!",
        "You know the alphabet from A all the way to Z.",
        "Great job today!",
      ],
    },
  ],
};

export default alphabetLesson;
