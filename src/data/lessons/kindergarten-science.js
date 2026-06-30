// Kindergarten — Science: My Body
// One body part per section, GIANT on screen, child-friendly narration.
// Modelled after kindergarten-numbers / kindergarten-objects.

// Background gradients picked for contrast against each emoji's
// dominant colour. Teeth (🦷) is mostly white, so its bg is deep slate.
// Nose/Mouth/Hair are peach-skin or red tones, so their bgs avoid the
// matching pastel family they used to sit on.
const BODY_PARTS = [
  { name: "Eyes",  emoji: "👀", action: "see",   color: "from-sky-300 to-sky-200" },
  { name: "Ears",  emoji: "👂", action: "hear",  color: "from-amber-300 to-amber-200" },
  { name: "Nose",  emoji: "👃", action: "smell", color: "from-blue-300 to-blue-200" },
  { name: "Mouth", emoji: "👄", action: "talk and eat", color: "from-indigo-300 to-indigo-200" },
  { name: "Teeth", emoji: "🦷", action: "chew our food", color: "from-slate-700 to-slate-900" },
  { name: "Tongue", emoji: "👅", action: "taste",  color: "from-lime-300 to-lime-200" },
  { name: "Hands", emoji: "✋", action: "hold and clap", color: "from-emerald-300 to-emerald-200" },
  { name: "Feet",  emoji: "🦶", action: "walk and run", color: "from-teal-300 to-teal-200" },
  { name: "Hair",  emoji: "💇", action: "cover and protect our head", color: "from-violet-300 to-violet-200" },
  { name: "Brain", emoji: "🧠", action: "think and learn", color: "from-yellow-300 to-amber-200" },
];

const sections = BODY_PARTS.map((item, i) => ({
  id: `body-${item.name.toLowerCase()}`,
  heading: `My ${item.name}`,
  visual: { type: "kg-object", name: item.name, emoji: item.emoji, color: item.color },
  sentences: [
    `${item.name}.`,
    `These are my ${item.name}.`,
    `We use our ${item.name} to ${item.action}.`,
    `Say it with me. ${item.name}!`,
    i < BODY_PARTS.length - 1
      ? `Well done! Let's see the next part.`
      : `Wonderful! You know all the parts of your body.`,
  ],
}));

const scienceLesson = {
  id: "kg-science-body",
  subjectId: "kg-science",
  subjectName: "Science",
  classLevel: "Kindergarten",
  topic: "My Body",
  title: "My Body",
  layout: "kindergarten",
  durationMinutes: 7,
  objectives: ["Name parts of the body", "Say what each part is used for"],
  sections: [
    {
      id: "intro",
      heading: "Let's Learn About Our Body!",
      visual: { type: "kg-banner", icon: "🧒", label: "My Body", color: "from-emerald-200 to-teal-100" },
      sentences: [
        "Hello little stars!",
        "Today we will learn about parts of our body.",
        "Touch each part with me as we go!",
      ],
    },
    ...sections,
    {
      id: "outro",
      heading: "Super Job!",
      visual: { type: "kg-banner", icon: "🌟", label: "You know your body!", color: "from-amber-200 to-yellow-100" },
      sentences: [
        "Amazing!",
        "You can name all the parts of your body.",
        "Take good care of your body every day!",
      ],
    },
  ],
};

export default scienceLesson;
