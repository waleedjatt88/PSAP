// Kindergarten — Object Recognition
// "What is this?" big object on screen, AI names it, asks the child to repeat.

const OBJECTS = [
  { name: "Banana", emoji: "🍌", color: "from-yellow-200 to-yellow-100", category: "fruit" },
  { name: "Mango", emoji: "🥭", color: "from-orange-200 to-orange-100", category: "fruit" },
  { name: "Bus", emoji: "🚌", color: "from-amber-200 to-amber-100", category: "transport" },
  { name: "Car", emoji: "🚗", color: "from-rose-200 to-rose-100", category: "transport" },
  { name: "Drum", emoji: "🥁", color: "from-fuchsia-200 to-pink-100", category: "music", photoHint: "drum musical instrument" },
  { name: "Bell", emoji: "🔔", color: "from-amber-200 to-yellow-100", category: "music", photoHint: "bell ringing" },
  { name: "Cow", emoji: "🐄", color: "from-lime-200 to-lime-100", category: "animal" },
  { name: "Goat", emoji: "🐐", color: "from-emerald-200 to-emerald-100", category: "animal" },
  { name: "Bag", emoji: "🎒", color: "from-violet-200 to-purple-100", category: "school", photoHint: "school backpack bag" },
  { name: "Book", emoji: "📕", color: "from-rose-200 to-pink-100", category: "school", photoHint: "children's storybook" },
];

const sections = OBJECTS.map((item, i) => ({
  id: `object-${item.name.toLowerCase()}`,
  heading: `This is a ${item.name}`,
  visual: { type: "kg-object", ...item },
  sentences: [
    `Look! What is this?`,
    `This is a ${item.name}.`,
    `${item.name}.`,
    `Say it with me. ${item.name}!`,
    i < OBJECTS.length - 1
      ? `Lovely! Let's see the next one.`
      : `Wonderful! You know so many things!`,
  ],
}));

const objectsLesson = {
  id: "kg-objects",
  subjectId: "kg-recognition",
  subjectName: "What Is This?",
  classLevel: "Kindergarten",
  topic: "Object Recognition",
  title: "Things Around Us",
  layout: "kindergarten",
  durationMinutes: 6,
  objectives: ["Name everyday objects", "Group things together (fruits, animals, transport)"],
  sections: [
    {
      id: "intro",
      heading: "Let's Look!",
      visual: { type: "kg-banner", icon: "👀", label: "What is this?", color: "from-sky-200 to-cyan-100", blocks: ["🍌", "🚌", "🥁"] },
      sentences: [
        "Hello friends!",
        "Today we will look at things you see every day.",
        "I will show you, and you will say the name with me.",
      ],
    },
    ...sections,
    {
      id: "outro",
      heading: "Super Star!",
      visual: { type: "kg-banner", icon: "⭐", label: "You named them all!", color: "from-amber-200 to-orange-100", blocks: ["🐄", "🎒", "⭐"] },
      sentences: [
        "Amazing job!",
        "You can name so many things now.",
        "See you in the next lesson!",
      ],
    },
  ],
};

export default objectsLesson;
