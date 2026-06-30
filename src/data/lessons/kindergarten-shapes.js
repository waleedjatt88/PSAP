// Kindergarten — Maths: Shapes
// Each section shows ONE giant shape on screen alongside a real-world
// object that looks like that shape. Modelled after kindergarten-numbers.

// White SVG shapes are drawn on these backgrounds — gradients are kept
// dark (700–900 range) so the shape and its white name caption read
// crisply against the bg.
const SHAPES = [
  { name: "Circle",    shape: "circle",    emoji: "⚽", example: "ball",   color: "from-rose-700 to-rose-900" },
  { name: "Square",    shape: "square",    emoji: "🪟", example: "window", color: "from-amber-700 to-orange-900" },
  { name: "Triangle",  shape: "triangle",  emoji: "🍕", example: "pizza slice", color: "from-orange-700 to-red-900" },
  { name: "Rectangle", shape: "rectangle", emoji: "📕", example: "book",   color: "from-emerald-700 to-emerald-900" },
  { name: "Star",      shape: "star",      emoji: "⭐", example: "star in the sky", color: "from-indigo-700 to-indigo-950" },
  { name: "Heart",     shape: "heart",     emoji: "❤️", example: "love heart",     color: "from-pink-700 to-fuchsia-900" },
  { name: "Diamond",   shape: "diamond",   emoji: "💎", example: "shiny diamond",  color: "from-sky-700 to-blue-900" },
  { name: "Oval",      shape: "oval",      emoji: "🥚", example: "egg",    color: "from-slate-700 to-slate-900" },
];

const sections = SHAPES.map((item, i) => ({
  id: `shape-${item.shape}`,
  heading: `This is a ${item.name}`,
  visual: { type: "kg-shape", ...item },
  sentences: [
    `${item.name}.`,
    `This shape is called a ${item.name}.`,
    `A ${item.example} looks like a ${item.name}.`,
    `Say it with me. ${item.name}!`,
    i < SHAPES.length - 1
      ? `Lovely! Let's see the next shape.`
      : `Wonderful! You know all the shapes now.`,
  ],
}));

const shapesLesson = {
  id: "kg-shapes",
  subjectId: "kg-maths",
  subjectName: "Maths",
  classLevel: "Kindergarten",
  topic: "Shapes Around Us",
  title: "Shapes Around Us",
  layout: "kindergarten",
  durationMinutes: 6,
  objectives: ["Recognise basic shapes", "Match each shape to a real-world object"],
  sections: [
    {
      id: "intro",
      heading: "Let's Learn Shapes!",
      visual: { type: "kg-banner", icon: "🔷", label: "Shapes Around Us", color: "from-blue-800 to-indigo-900" },
      sentences: [
        "Hello little friends!",
        "Today we are going to learn about shapes.",
        "Shapes are all around us. Let's find them!",
      ],
    },
    ...sections,
    {
      id: "outro",
      heading: "You Did It!",
      visual: { type: "kg-banner", icon: "🎉", label: "You learned every shape!", color: "from-fuchsia-700 to-purple-900" },
      sentences: [
        "Hooray!",
        "You learned about circles, squares, triangles and more.",
        "Look around. How many shapes can you find?",
      ],
    },
  ],
};

export default shapesLesson;
