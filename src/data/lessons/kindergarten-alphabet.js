// Kindergarten — Alphabet A-Z
// Visual-heavy: every "section" is a single big letter scene.
// The slide layout for kind:"kindergarten" lessons takes over the
// screen with a huge animated letter + matching object.

// Every letter now renders through LetterPhotoScene, which fetches a
// real stock photo of `word` (or `photoHint` if set, for ambiguous
// words) from Pexels/Unsplash via /api/image. Loading + error states
// both fall back to the `emoji` so the lesson always works.
// `photoHint` and `videoHint` are SEPARATE Pexels search queries because
// Pexels' photo and video indexes are independent — what works as a
// photo query often returns wrong content as a video query (e.g.
// "cute fluffy rabbit bunny" video search returns puppies). Tuned per
// letter so the kid always sees the exact thing the AI is talking about.
const ALPHABET = [
  // videoHint kept SHORT and word-anchored so the api/video.js relevance
  // filter (which checks Pexels page slug contains the query word) has
  // a clean signal. The bare word is usually best for video search.
  { letter: "A", word: "Apple", emoji: "🍎", color: "from-rose-200 to-rose-100", photoHint: "red apple fruit", videoHint: "apple" },
  { letter: "B", word: "Ball", emoji: "⚽", color: "from-amber-200 to-amber-100", photoHint: "colorful ball toy", videoHint: "ball" },
  { letter: "C", word: "Cat", emoji: "🐱", color: "from-orange-200 to-orange-100", photoHint: "cute kitten cat", videoHint: "cat" },
  { letter: "D", word: "Dog", emoji: "🐶", color: "from-yellow-200 to-yellow-100", photoHint: "happy puppy dog", videoHint: "dog" },
  { letter: "E", word: "Elephant", emoji: "🐘", color: "from-lime-200 to-lime-100", photoHint: "elephant in nature", videoHint: "elephant" },
  { letter: "F", word: "Fish", emoji: "🐟", color: "from-emerald-200 to-emerald-100", photoHint: "colorful fish underwater", videoHint: "fish" },
  { letter: "G", word: "Giraffe", emoji: "🦒", color: "from-teal-200 to-teal-100", photoHint: "giraffe in savanna", videoHint: "giraffe" },
  { letter: "H", word: "House", emoji: "🏠", color: "from-cyan-200 to-cyan-100", photoHint: "modern family home exterior", videoHint: "house" },
  { letter: "I", word: "Ice cream", emoji: "🍦", color: "from-sky-200 to-sky-100", photoHint: "ice cream cone single scoop", videoHint: "ice cream" },
  { letter: "J", word: "Jug", emoji: "🍯", color: "from-blue-200 to-blue-100", photoHint: "ceramic water pitcher jug", videoHint: "jug" },
  { letter: "K", word: "Kite", emoji: "🪁", color: "from-indigo-200 to-indigo-100", photoHint: "colorful kite flying sky", videoHint: "kite" },
  { letter: "L", word: "Lion", emoji: "🦁", color: "from-violet-200 to-violet-100", photoHint: "lion close up portrait", videoHint: "lion" },
  { letter: "M", word: "Mango", emoji: "🥭", color: "from-purple-200 to-purple-100", photoHint: "ripe yellow mango fruit", videoHint: "mango" },
  { letter: "N", word: "Nest", emoji: "🪺", color: "from-fuchsia-200 to-fuchsia-100", photoHint: "bird nest with eggs", videoHint: "nest" },
  { letter: "O", word: "Orange", emoji: "🍊", color: "from-pink-200 to-pink-100", photoHint: "fresh orange fruit", videoHint: "orange fruit" },
  { letter: "P", word: "Pen", emoji: "✏️", color: "from-rose-200 to-rose-100", photoHint: "ballpoint pen writing", videoHint: "pen writing" },
  { letter: "Q", word: "Queen", emoji: "👸", color: "from-amber-200 to-amber-100", photoHint: "golden crown jewels royal", videoHint: "crown" },
  { letter: "R", word: "Rabbit", emoji: "🐰", color: "from-orange-200 to-orange-100", photoHint: "cute fluffy rabbit bunny", videoHint: "rabbit" },
  { letter: "S", word: "Sun", emoji: "☀️", color: "from-yellow-200 to-yellow-100", photoHint: "bright sun blue sky", videoHint: "sun" },
  { letter: "T", word: "Tree", emoji: "🌳", color: "from-lime-200 to-lime-100", photoHint: "big green tree nature", videoHint: "tree" },
  { letter: "U", word: "Umbrella", emoji: "☂️", color: "from-emerald-200 to-emerald-100", photoHint: "colorful open umbrella", videoHint: "umbrella" },
  { letter: "V", word: "Van", emoji: "🚐", color: "from-teal-200 to-teal-100", photoHint: "delivery van vehicle", videoHint: "van" },
  { letter: "W", word: "Whale", emoji: "🐋", color: "from-cyan-200 to-cyan-100", photoHint: "whale ocean swimming", videoHint: "whale" },
  { letter: "X", word: "Xylophone", emoji: "🎹", color: "from-sky-200 to-sky-100", photoHint: "wooden xylophone music instrument", videoHint: "xylophone" },
  { letter: "Y", word: "Yam", emoji: "🍠", color: "from-blue-200 to-blue-100", photoHint: "sweet potato yam tuber", videoHint: "sweet potato" },
  { letter: "Z", word: "Zebra", emoji: "🦓", color: "from-indigo-200 to-indigo-100", photoHint: "zebra stripes wildlife", videoHint: "zebra" },
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
