// JSS 1 Mathematics — Fractions
// Source: client-supplied JSS 1 Mathematics Scheme of Work (First Term),
// Weeks 4–6 (Meaning of fractions, Types, Equivalent fractions, Ordering,
// Conversion to decimals & percentages).
//
// Structure: an array of `sections`. Each section has a heading and an
// ordered list of `sentences` — the teleprompter speaks one sentence at
// a time and highlights it on screen as it plays. The AI Q&A is locked
// to ONLY this content.

const fractionsLesson = {
  id: "jss1-math-fractions",
  subjectId: "mathematics",
  subjectName: "Mathematics",
  classLevel: "JSS 1",
  topic: "Fractions",
  title: "Fractions",
  durationMinutes: 12,
  objectives: [
    "Understand what a fraction is",
    "Identify the parts of a fraction",
    "Recognize the three main types of fractions",
    "Find equivalent fractions",
    "Convert fractions to decimals and percentages",
  ],
  sections: [
    {
      id: "intro",
      heading: "Welcome",
      sentences: [
        "Hello students, and welcome to today's lesson.",
        "My name is PassPoint AI, and today we are going to learn about fractions.",
        "By the end of this lesson, you will know what a fraction is, the different types of fractions, and how to convert fractions to decimals and percentages.",
        "Please listen carefully, and feel free to pause me at any time if you have a question.",
      ],
    },
    {
      id: "meaning",
      heading: "Meaning of a Fraction",
      sentences: [
        "A fraction is a number that represents a part of a whole, or a part of a group.",
        "Imagine you have one whole orange, and you cut it into two equal parts.",
        "Each part is called one half, and we write it as one over two.",
        "In the same way, if you cut a loaf of bread into four equal slices and take one slice, you have one quarter, written as one over four.",
        "So whenever you see a fraction, remember it is just a way of describing a part of something whole.",
      ],
    },
    {
      id: "parts",
      heading: "Parts of a Fraction",
      sentences: [
        "Every fraction has two parts: the top number and the bottom number.",
        "The top number is called the numerator, and it tells us how many parts we are taking.",
        "The bottom number is called the denominator, and it tells us the total number of equal parts the whole has been divided into.",
        "For example, in the fraction three over five, the numerator is three and the denominator is five.",
        "This means the whole has been divided into five equal parts, and we are taking three of those parts.",
      ],
    },
    {
      id: "types",
      heading: "Types of Fractions",
      sentences: [
        "There are three main types of fractions you must know: proper fractions, improper fractions, and mixed numbers.",
        "A proper fraction is one where the numerator is smaller than the denominator. Examples are one over two, three over four, and five over eight.",
        "An improper fraction is one where the numerator is bigger than or equal to the denominator. Examples are seven over four, nine over five, and eight over eight.",
        "A mixed number is a whole number combined with a proper fraction. An example is two and one over three, which means two whole units plus one third.",
        "Every improper fraction can be written as a mixed number, and every mixed number can be written as an improper fraction.",
      ],
    },
    {
      id: "equivalent",
      heading: "Equivalent Fractions",
      sentences: [
        "Two fractions are called equivalent fractions when they represent the same value, even though they look different.",
        "For example, one over two is the same value as two over four, and also the same as four over eight.",
        "To find an equivalent fraction, you can multiply the numerator and the denominator by the same whole number.",
        "If we multiply the top and bottom of one over two by three, we get three over six, which is also equivalent to one over two.",
        "You can also divide the top and bottom by the same number to get a simpler equivalent fraction.",
        "For example, six over twelve divided by six on the top and on the bottom gives us one over two.",
      ],
    },
    {
      id: "ordering",
      heading: "Ordering Fractions",
      sentences: [
        "Sometimes we need to compare fractions to know which one is bigger or smaller.",
        "When two fractions have the same denominator, the one with the bigger numerator is bigger. So three over seven is bigger than two over seven.",
        "When the denominators are different, we first change them to have the same denominator before we compare.",
        "For example, to compare one over two and two over five, we find a common denominator, which is ten, giving us five over ten and four over ten. So one over two is bigger.",
      ],
    },
    {
      id: "conversions",
      heading: "Converting Fractions",
      sentences: [
        "Fractions can be converted to decimals by dividing the numerator by the denominator.",
        "For example, one over two becomes zero point five, and three over four becomes zero point seven five.",
        "To convert a fraction to a percentage, we multiply the fraction by one hundred and add a percent sign.",
        "So one over two becomes fifty percent, and three over four becomes seventy five percent.",
        "Decimals and percentages are simply other ways of writing the same fraction.",
      ],
    },
    {
      id: "summary",
      heading: "Summary",
      sentences: [
        "Let us quickly review what we have learned today.",
        "A fraction is a part of a whole, with a numerator on top and a denominator on the bottom.",
        "We have three main types of fractions: proper fractions, improper fractions, and mixed numbers.",
        "Equivalent fractions look different but have the same value.",
        "And we can convert any fraction into a decimal or a percentage.",
        "Well done for following along. Now you may try the practice questions, or ask me any question about today's lesson.",
      ],
    },
  ],
};

export default fractionsLesson;
