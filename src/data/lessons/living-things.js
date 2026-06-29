// JSS 1 Basic Science — Living Things
// Source: official lesson notes supplied by the client.

const livingThingsLesson = {
  id: "jss1-basicscience-living-things",
  subjectId: "basic-science",
  subjectName: "Basic Science",
  classLevel: "JSS 1",
  topic: "Living Things",
  title: "Living Things",
  durationMinutes: 15,
  objectives: [
    "Define living things",
    "Distinguish between living and non-living things",
    "State the characteristics of living things",
    "Give examples of living things in the environment",
    "Classify living things into major groups",
  ],
  sections: [
    {
      id: "intro",
      heading: "Welcome",
      visual: {
        type: "banner",
        icon: "🌍",
        label: "Living Things",
        subtitle: "JSS 1 Basic Science",
      },
      sentences: [
        "Hello students, and welcome to today's Basic Science lesson.",
        "Today we will learn about living things.",
        "Every day, we see many objects around us.",
        "Some of them move, grow, breathe, and reproduce, while others do not.",
        "For example, a boy grows taller as he gets older.",
        "A mango tree grows from a seed into a large tree.",
        "A puppy grows into a dog.",
        "But a table, a stone, or a chair does not grow or reproduce.",
        "This difference helps us understand the concept of living and non-living things.",
      ],
    },
    {
      id: "definition",
      heading: "Definition of Living Things",
      visual: {
        type: "icon-grid",
        columns: 3,
        items: [
          { emoji: "🧑", label: "Humans" },
          { emoji: "🐕", label: "Dogs" },
          { emoji: "🐦", label: "Birds" },
          { emoji: "🌳", label: "Trees" },
          { emoji: "🐟", label: "Fish" },
          { emoji: "🦋", label: "Insects" },
        ],
      },
      sentences: [
        "Living things are organisms that have life.",
        "They carry out life processes such as feeding, breathing, growing, reproducing, moving, responding to changes in their environment, and removing waste products.",
        "Examples of living things include human beings, dogs, cats, birds, fish, trees, grass, insects, and bacteria.",
      ],
    },
    {
      id: "non-living",
      heading: "Non-Living Things",
      visual: {
        type: "icon-grid",
        columns: 3,
        items: [
          { emoji: "🪨", label: "Stone" },
          { emoji: "🪑", label: "Chair" },
          { emoji: "📚", label: "Books" },
          { emoji: "🚗", label: "Car" },
          { emoji: "🍾", label: "Bottle" },
          { emoji: "✏️", label: "Pencil" },
        ],
      },
      sentences: [
        "Non-living things are objects that do not have life.",
        "They do not perform the life processes.",
        "Examples include stones, chairs, tables, books, cars, bottles, and pencils.",
        "Although some non-living things, such as cars, can move, they only move when powered or controlled by something else.",
        "They do not grow, reproduce, or breathe on their own.",
      ],
    },
    {
      id: "mrs-gren",
      heading: "Characteristics: MRS GREN",
      visual: {
        type: "acronym",
        word: "MRSGREN",
        meanings: [
          "Movement",
          "Respiration",
          "Sensitivity",
          "Growth",
          "Reproduction",
          "Excretion",
          "Nutrition",
        ],
      },
      sentences: [
        "Scientists often remember the characteristics of living things with the acronym MRS GREN.",
        "MRS GREN stands for Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, and Nutrition.",
        "Let us go through each one.",
      ],
    },
    {
      id: "movement",
      heading: "Movement",
      visual: {
        type: "icon-grid",
        columns: 2,
        items: [
          { emoji: "🐦", label: "A bird flies" },
          { emoji: "🐟", label: "A fish swims" },
          { emoji: "🌻", label: "Plants bend to sun" },
          { emoji: "🏃", label: "We walk and run" },
        ],
      },
      sentences: [
        "First, Movement.",
        "Living things can move by themselves, or move parts of their bodies.",
        "A bird flies, a fish swims, and even plants slowly bend toward sunlight.",
      ],
    },
    {
      id: "respiration",
      heading: "Respiration",
      visual: {
        type: "icon-grid",
        columns: 3,
        items: [
          { emoji: "🫁", label: "Lungs (humans)" },
          { emoji: "🐠", label: "Gills (fish)" },
          { emoji: "🌿", label: "Stomata (plants)" },
        ],
      },
      sentences: [
        "Second, Respiration.",
        "Living things release energy from food through respiration.",
        "Humans breathe using lungs, fish use gills, and plants also respire.",
      ],
    },
    {
      id: "sensitivity",
      heading: "Sensitivity",
      visual: {
        type: "icon-grid",
        columns: 2,
        items: [
          { emoji: "🔥", label: "Pull away from heat" },
          { emoji: "🌱", label: "Leaves fold when touched" },
          { emoji: "👀", label: "Eyes react to light" },
          { emoji: "👂", label: "Ears react to sound" },
        ],
      },
      sentences: [
        "Third, Sensitivity, also called response to stimuli.",
        "Living things respond to changes in their environment.",
        "For example, you pull your hand away from a hot object.",
        "And some plants fold their leaves when touched.",
      ],
    },
    {
      id: "growth",
      heading: "Growth",
      visual: {
        type: "icon-grid",
        columns: 2,
        items: [
          { emoji: "👶", label: "Baby" },
          { emoji: "🧑", label: "Adult" },
          { emoji: "🌱", label: "Seed" },
          { emoji: "🌳", label: "Tree" },
        ],
      },
      sentences: [
        "Fourth, Growth.",
        "Living things increase in size and develop over time.",
        "A baby grows into an adult, and a seed grows into a plant.",
      ],
    },
    {
      id: "reproduction",
      heading: "Reproduction",
      visual: {
        type: "icon-grid",
        columns: 3,
        items: [
          { emoji: "🥚", label: "Birds lay eggs" },
          { emoji: "👶", label: "Mammals give birth" },
          { emoji: "🌰", label: "Plants make seeds" },
        ],
      },
      sentences: [
        "Fifth, Reproduction.",
        "Living things produce young ones, or offspring, of their own kind.",
        "Birds lay eggs, mammals give birth to young ones, and plants produce seeds.",
      ],
    },
    {
      id: "excretion",
      heading: "Excretion",
      visual: {
        type: "icon-grid",
        columns: 2,
        items: [
          { emoji: "💧", label: "Urine & sweat" },
          { emoji: "🍃", label: "Plants release waste" },
        ],
      },
      sentences: [
        "Sixth, Excretion.",
        "Living things remove waste products from their bodies.",
        "Humans produce urine and sweat, and plants release some wastes through their leaves.",
      ],
    },
    {
      id: "nutrition",
      heading: "Nutrition",
      visual: {
        type: "icon-grid",
        columns: 3,
        items: [
          { emoji: "🍎", label: "Humans eat food" },
          { emoji: "🐄", label: "Cows graze on grass" },
          { emoji: "☀️", label: "Plants use sunlight" },
        ],
      },
      sentences: [
        "Finally, Nutrition.",
        "Living things need food, or nutrients, to survive and to obtain energy.",
        "Humans eat food, cows graze on grass, and green plants make their own food through photosynthesis.",
      ],
    },
    {
      id: "groups",
      heading: "Major Groups of Living Things",
      visual: {
        type: "icon-grid",
        columns: 3,
        items: [
          { emoji: "🌳", label: "Plants" },
          { emoji: "🦁", label: "Animals" },
          { emoji: "🦠", label: "Microorganisms" },
        ],
      },
      sentences: [
        "Living things are classified into three major groups: plants, animals, and microorganisms.",
        "Plants make their own food using sunlight, water, and carbon dioxide. Examples are the mango tree, maize, grass, hibiscus, and palm tree.",
        "Animals cannot make their own food. They depend on plants or other animals for nourishment. Examples are lions, goats, cows, chickens, fish, and human beings.",
        "Microorganisms are tiny living things that can only be seen clearly with special instruments such as a microscope. Examples are bacteria, some fungi, and protozoa.",
      ],
    },
    {
      id: "summary",
      heading: "Summary",
      visual: {
        type: "banner",
        icon: "✅",
        label: "You learned",
        subtitle: "Definition · Living vs Non-Living · MRS GREN · Plants, Animals, Microorganisms",
      },
      sentences: [
        "Let us summarize today's lesson.",
        "Living things are organisms that have life and carry out life processes.",
        "They include plants, animals, and microorganisms.",
        "Non-living things do not perform these life processes.",
        "We use the acronym MRS GREN to remember the seven characteristics of living things.",
        "Well done for following along. You may try the practice questions, or pause me to ask any question.",
      ],
    },
  ],

  // Official quiz bank — exact questions from the client-supplied lesson
  // notes. The AI is instructed (in lib/provider.js) to use THESE questions
  // verbatim when the student asks to be quizzed.
  quiz: {
    quickQuiz: [
      { q: "What is a living thing?", a: "An organism that has life and carries out life processes.", marks: 2 },
      { q: "Mention any four characteristics of living things.", a: "Any four from: Movement, Respiration, Sensitivity, Growth, Reproduction, Excretion, Nutrition.", marks: 4 },
      { q: "Give three examples of non-living things.", a: "Any three from: stones, chairs, tables, books, cars, bottles, pencils.", marks: 3 },
      { q: "Why is growth considered evidence that something is living?", a: "Because only living things naturally increase in size and develop over time.", marks: 2 },
      { q: "Name the acronym used to remember the characteristics of living things.", a: "MRS GREN", marks: 1 },
    ],
    mcqs: [
      {
        q: "Which of the following is a living thing?",
        options: { A: "Stone", B: "Chair", C: "Goat", D: "Bottle" },
        answer: "C",
        marks: 2,
      },
      {
        q: "Which characteristic of living things involves producing young ones?",
        options: { A: "Growth", B: "Respiration", C: "Reproduction", D: "Excretion" },
        answer: "C",
        marks: 2,
      },
      {
        q: "Which of the following is NOT a characteristic of living things?",
        options: {
          A: "Nutrition",
          B: "Reproduction",
          C: "Photosynthesis (for all living things)",
          D: "Excretion",
        },
        answer: "C",
        marks: 2,
      },
    ],
    theory: [
      {
        q: "Define living things and list any five characteristics of living organisms.",
        marks: 6,
      },
      {
        q: "Differentiate between living and non-living things using at least four points, and give three examples of each.",
        marks: 8,
      },
    ],
    assignment: [
      {
        q: "List seven characteristics of living things and explain any three.",
        marks: 7,
      },
      {
        q: "Classify the following as living or non-living: Bicycle, Dog, Mushroom, Tree, Rock, Butterfly, Notebook, Fish.",
        marks: 8,
      },
      {
        q: "State five ways in which living things are important to human beings and the environment.",
        marks: 5,
      },
    ],
  },
};

export default livingThingsLesson;
