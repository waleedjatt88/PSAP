// JSS 1 Mathematics — Fractions
// Source: official lesson notes supplied by the client.
// Sentences are written in spoken-natural form (e.g. "three over five"
// instead of "3/5") so the Web Speech API reads them aloud cleanly.

const fractionsLesson = {
  id: "jss1-math-fractions",
  subjectId: "mathematics",
  subjectName: "Mathematics",
  classLevel: "JSS 1",
  topic: "Fractions",
  title: "Fractions",
  durationMinutes: 15,
  objectives: [
    "Define a fraction",
    "Identify the numerator and denominator",
    "State and explain different types of fractions",
    "Convert improper fractions to mixed fractions and vice versa",
    "Add and subtract fractions",
    "Solve simple problems involving fractions",
  ],
  sections: [
    {
      id: "intro",
      heading: "Welcome",
      sentences: [
        "Hello students, and welcome to today's Mathematics lesson.",
        "Today's topic is Fractions.",
        "Before today, you already know how to count whole numbers like one, two, three, ten, fifty, and one hundred.",
        "You also know that objects can be shared equally among people.",
        "For example, if one apple is shared equally between two children, each child gets half of the apple.",
        "Or if a cake is cut into four equal parts and one part is taken, that part is one out of four equal parts.",
        "This idea of representing a part of a whole leads us to the concept of fractions.",
      ],
    },
    {
      id: "definition",
      heading: "Definition of a Fraction",
      sentences: [
        "A fraction is a number that represents a part of a whole, or a part of a group.",
        "Every fraction has two parts: the numerator and the denominator.",
        "The numerator is the number on top, and it shows how many parts are taken.",
        "The denominator is the number on the bottom, and it shows the total number of equal parts.",
        "For example, in the fraction three over five, the numerator is three and the denominator is five.",
        "This means that out of five equal parts, three parts have been taken.",
      ],
    },
    {
      id: "proper",
      heading: "Proper Fractions",
      sentences: [
        "There are three main types of fractions.",
        "The first type is a proper fraction.",
        "A proper fraction is one where the numerator is less than the denominator.",
        "Examples of proper fractions are one over two, three over five, and four over seven.",
        "The value of a proper fraction is always less than one whole.",
      ],
    },
    {
      id: "improper",
      heading: "Improper Fractions",
      sentences: [
        "The second type is an improper fraction.",
        "An improper fraction is one where the numerator is greater than, or equal to, the denominator.",
        "Examples are seven over five, nine over four, and eight over eight.",
        "An improper fraction represents one whole, or more than one whole.",
      ],
    },
    {
      id: "mixed",
      heading: "Mixed Fractions",
      sentences: [
        "The third type is a mixed fraction, also called a mixed number.",
        "A mixed fraction has a whole number combined with a proper fraction.",
        "Examples are one and one over two, two and three over four, and five and two over three.",
        "Mixed fractions are used to express improper fractions in a simpler form.",
        "For example, seven over five is the same as one and two over five.",
      ],
    },
    {
      id: "equivalent",
      heading: "Equivalent Fractions",
      sentences: [
        "Equivalent fractions are different fractions that have the same value.",
        "For example, one over two is equal to two over four, which is also equal to three over six.",
        "We obtain equivalent fractions by multiplying or dividing both the numerator and the denominator by the same number.",
        "If we multiply the top and bottom of one over two by three, we get three over six, which is still equal to one over two.",
      ],
    },
    {
      id: "convert-to-mixed",
      heading: "Converting Improper to Mixed",
      sentences: [
        "To convert an improper fraction to a mixed fraction, follow these steps.",
        "Step one: divide the numerator by the denominator.",
        "Step two: the quotient becomes the whole number.",
        "Step three: the remainder becomes the new numerator.",
        "Step four: keep the same denominator.",
        "For example, to convert nine over four: nine divided by four is two, with a remainder of one.",
        "So nine over four is equal to two and one over four.",
      ],
    },
    {
      id: "convert-to-improper",
      heading: "Converting Mixed to Improper",
      sentences: [
        "To convert a mixed fraction to an improper fraction, follow these steps.",
        "Step one: multiply the whole number by the denominator.",
        "Step two: add the numerator.",
        "Step three: place the result over the original denominator.",
        "For example, to convert two and three over five: multiply two by five to get ten, then add three to get thirteen.",
        "So two and three over five is equal to thirteen over five.",
      ],
    },
    {
      id: "addition",
      heading: "Addition of Fractions",
      sentences: [
        "Now let us learn how to add fractions.",
        "When the fractions have the same denominator, simply add the numerators and keep the denominator the same.",
        "For example, two over seven plus three over seven equals five over seven.",
        "When the fractions have different denominators, first find the lowest common multiple, then convert both fractions to have that common denominator.",
        "For example, to add one over two and one over four, the lowest common multiple of two and four is four.",
        "We convert one over two into two over four.",
        "Then we add: two over four plus one over four equals three over four.",
      ],
    },
    {
      id: "subtraction",
      heading: "Subtraction of Fractions",
      sentences: [
        "Subtraction of fractions works the same way as addition.",
        "When the denominators are the same, subtract the numerators and keep the denominator.",
        "For example, five over eight minus two over eight equals three over eight.",
        "When the denominators are different, first make them the same, then subtract.",
        "For example, to do three over four minus one over two: convert one over two to two over four, then subtract three over four minus two over four to get one over four.",
      ],
    },
    {
      id: "summary",
      heading: "Summary",
      sentences: [
        "Let us summarize what we have learned today.",
        "A fraction represents part of a whole, with a numerator on top and a denominator on the bottom.",
        "There are three types of fractions: proper, improper, and mixed.",
        "Improper fractions can be converted to mixed fractions, and mixed fractions can be converted to improper fractions.",
        "Equivalent fractions are different fractions that have the same value.",
        "Fractions can be added or subtracted by making sure they have the same denominator.",
        "Well done for following along today. You may now try the practice questions, or pause me to ask any question.",
      ],
    },
  ],
};

export default fractionsLesson;
