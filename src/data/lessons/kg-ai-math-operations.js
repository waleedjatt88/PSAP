// Kindergarten — "AI Math Teacher": one welcome slide plus ten short
// narrated math concepts (addition through equal-to), each a full
// "lecture" section. Every concept section's `visual` is an
// "equation-reveal" (see LessonVisual.jsx) that writes in one token —
// first number, then operator + second number, then the answer — in
// sync with the narration via `revealAtSentence`, the same mechanism
// the JSS Fractions lesson uses for its worked examples.
//
// classLevel: "Kindergarten" gives this the same natural, no-button
// "just talk to ask a question" voice flow as the other Kindergarten
// lessons (see Lesson.jsx's isKindergarten branch) — the AI teacher
// pauses and answers whenever the student speaks mid-lecture.

const aiMathOperationsLesson = {
  id: "kg-ai-math-operations",
  subjectId: "kg-ai-math",
  subjectName: "Mathematics",
  classLevel: "Kindergarten",
  topic: "Numbers Come Alive",
  title: "Numbers Come Alive",
  durationMinutes: 12,
  objectives: [
    "Add and subtract small numbers",
    "Multiply and divide small numbers",
    "Count a group of objects",
    "Recognize a written number",
    "Find a missing number in an equation",
    "Compare two numbers using greater than, less than, and equal to",
  ],
  sections: [
    {
      id: "intro",
      heading: "Welcome",
      visual: { type: "banner", icon: "🧮", label: "Numbers Come Alive", subtitle: "AI Math Teacher" },
      sentences: [
        "Hello little stars, and welcome to Math class!",
        "Today your AI teacher is going to bring numbers to life on the board.",
        "We will add, subtract, multiply, divide, count, and compare numbers together.",
        "Let's get started!",
      ],
    },
    {
      id: "addition",
      heading: "Addition",
      visual: {
        type: "equation-reveal",
        lessonType: "addition",
        firstNumber: 5,
        secondNumber: 4,
        operator: "+",
        answer: 9,
        quiz: { firstNumber: 3, secondNumber: 2, answer: 5 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Today we will learn addition.",
        "We have five apples.",
        "We add four more apples.",
        "Five plus four equals nine, because addition puts two groups together to make one bigger group.",
        "Now you try — what is three plus two?",
      ],
    },
    {
      id: "subtraction",
      heading: "Subtraction",
      visual: {
        type: "equation-reveal",
        lessonType: "subtraction",
        firstNumber: 10,
        secondNumber: 3,
        operator: "−",
        answer: 7,
        quiz: { firstNumber: 8, secondNumber: 2, answer: 6 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Now let's learn subtraction.",
        "We start with ten balloons.",
        "Three balloons fly away.",
        "Ten minus three equals seven, because subtraction takes a smaller group away from a bigger group.",
        "Now you try — what is eight minus two?",
      ],
    },
    {
      id: "multiplication",
      heading: "Multiplication",
      visual: {
        type: "equation-reveal",
        lessonType: "multiplication",
        firstNumber: 3,
        secondNumber: 4,
        operator: "×",
        answer: 12,
        quiz: { firstNumber: 2, secondNumber: 3, answer: 6 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Next, let's learn multiplication.",
        "We have three baskets.",
        "Each basket has four oranges.",
        "Three times four equals twelve — multiplying is a fast way to add the same number many times.",
        "Now you try — what is two times three?",
      ],
    },
    {
      id: "division",
      heading: "Division",
      visual: {
        type: "equation-reveal",
        lessonType: "division",
        firstNumber: 12,
        secondNumber: 4,
        operator: "÷",
        answer: 3,
        quiz: { firstNumber: 10, secondNumber: 2, answer: 5 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Now let's learn division.",
        "We have twelve cookies.",
        "We share them equally into four plates.",
        "Twelve divided by four equals three — dividing means sharing a group equally into smaller groups.",
        "Now you try — what is ten divided by two?",
      ],
    },
    {
      id: "counting",
      heading: "Counting",
      visual: {
        type: "equation-reveal",
        lessonType: "counting",
        firstNumber: 6,
        icon: "⭐",
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Let's practice counting together.",
        "Look at the stars on the board.",
        "Count each star one by one: one, two, three, four, five, six.",
        "There are six stars in total — counting means saying numbers in order to find how many things there are.",
        "Now you try — how many stars do you count?",
      ],
    },
    {
      id: "number-recognition",
      heading: "Number Recognition",
      visual: {
        type: "equation-reveal",
        lessonType: "number-recognition",
        firstNumber: 7,
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Now let's recognize a number.",
        "Here is a big number on the board.",
        "Look closely at its shape.",
        "This number is seven — recognizing a number means knowing its name and how it looks when written.",
        "Now you try — what number do you see?",
      ],
    },
    {
      id: "missing-number",
      heading: "Missing Number",
      visual: {
        type: "equation-reveal",
        lessonType: "missing-number",
        firstNumber: 5,
        resultShown: 9,
        answer: 4,
        operator: "+",
        quiz: { firstNumber: 3, resultShown: 8, answer: 5 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Let's find the missing number.",
        "We start with five.",
        "We add a missing number to make nine.",
        "Five plus four equals nine, so the missing number is four.",
        "Now you try — three plus what number makes eight?",
      ],
    },
    {
      id: "greater-than",
      heading: "Greater Than",
      visual: {
        type: "equation-reveal",
        lessonType: "greater-than",
        firstNumber: 8,
        secondNumber: 5,
        operator: ">",
        quiz: { firstNumber: 6, secondNumber: 10, answer: 10 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Now let's compare two numbers.",
        "Here is the number eight.",
        "Here is the number five.",
        "Eight is greater than five — the open side of the symbol always faces the bigger number.",
        "Now you try — which number is bigger, six or ten?",
      ],
    },
    {
      id: "less-than",
      heading: "Less Than",
      visual: {
        type: "equation-reveal",
        lessonType: "less-than",
        firstNumber: 3,
        secondNumber: 9,
        operator: "<",
        quiz: { firstNumber: 7, secondNumber: 2, answer: 2 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Let's compare two more numbers.",
        "Here is the number three.",
        "Here is the number nine.",
        "Three is less than nine — the pointed side of the symbol always faces the smaller number.",
        "Now you try — which number is smaller, seven or two?",
      ],
    },
    {
      id: "equal-to",
      heading: "Equal To",
      visual: {
        type: "equation-reveal",
        lessonType: "equal-to",
        firstNumber: 6,
        secondNumber: 6,
        operator: "=",
        quiz: { firstNumber: 4, secondNumber: 4 },
        revealAtSentence: [0, 1, 2, 3, 3],
      },
      sentences: [
        "Finally, let's learn equal to.",
        "Here is a group of six.",
        "Here is another group of six.",
        "Six is equal to six — when two groups have the exact same amount, we say they are equal.",
        "Now you try — are four and four equal?",
      ],
    },
  ],
};

export default aiMathOperationsLesson;
