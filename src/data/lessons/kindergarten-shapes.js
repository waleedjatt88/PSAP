// Kindergarten — Maths: Shapes
// Each section shows ONE giant shape on screen alongside a real-world
// object that looks like that shape. Modelled after kindergarten-numbers.

const SHAPES = [
  { name: "Circle",    shape: "circle",    emoji: "⚽", example: "ball",   color: "from-rose-200 to-rose-100" },
  { name: "Square",    shape: "square",    emoji: "🪟", example: "window", color: "from-amber-200 to-amber-100" },
  { name: "Triangle",  shape: "triangle",  emoji: "🍕", example: "pizza slice", color: "from-orange-200 to-orange-100" },
  { name: "Rectangle", shape: "rectangle", emoji: "📕", example: "book",   color: "from-yellow-200 to-yellow-100" },
  { name: "Star",      shape: "star",      emoji: "⭐", example: "star in the sky", color: "from-lime-200 to-lime-100" },
  { name: "Heart",     shape: "heart",     emoji: "❤️", example: "love heart",     color: "from-emerald-200 to-emerald-100" },
  { name: "Diamond",   shape: "diamond",   emoji: "💎", example: "shiny diamond",  color: "from-teal-200 to-teal-100" },
  { name: "Oval",      shape: "oval",      emoji: "🥚", example: "egg",    color: "from-cyan-200 to-cyan-100" },
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
      visual: { type: "kg-banner", icon: "🔷", label: "Shapes Around Us", color: "from-blue-200 to-indigo-100" },
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
      visual: { type: "kg-banner", icon: "🎉", label: "You learned every shape!", color: "from-fuchsia-200 to-pink-100" },
      sentences: [
        "Hooray!",
        "You learned about circles, squares, triangles and more.",
        "Look around. How many shapes can you find?",
      ],
    },
  ],
};

export default shapesLesson;
