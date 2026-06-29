// JSS 1 first-term curriculum (Nigeria). Topics are realistic seed values —
// the actual lesson content is generated live by the AI based on
// classLevel + subject + topic, so adding new topics or whole new subjects
// only requires editing this file.

export const SUBJECTS = [
  {
    id: "english",
    name: "English Language",
    emoji: "📚",
    tint: "from-rose-100 to-rose-50",
    accent: "from-rose-500 to-rose-700",
    iconTint: "bg-rose-100",
    progress: 58,
    topics: [
      "Parts of Speech",
      "Sentence Construction",
      "Comprehension",
      "Reading Skills",
      "Letter Writing",
      "Vocabulary Development",
    ],
  },
  {
    id: "mathematics",
    name: "Mathematics",
    emoji: "📐",
    image: "math",
    tint: "from-blue-100 to-blue-50",
    accent: "from-blue-500 to-blue-700",
    iconTint: "bg-blue-100",
    progress: 72,
    topics: [
      "Fractions",
      "Number Bases",
      "Indices",
      "Whole Numbers",
      "Estimation",
      "Basic Operations",
      "Approximation",
    ],
  },
  {
    id: "basic-science",
    name: "Basic Science",
    emoji: "🌱",
    image: "science",
    tint: "from-emerald-100 to-emerald-50",
    accent: "from-emerald-500 to-emerald-700",
    iconTint: "bg-emerald-100",
    progress: 40,
    topics: [
      "Living and Non-Living Things",
      "Photosynthesis",
      "The Human Body",
      "Energy",
      "Force and Motion",
      "Plants and Animals",
    ],
  },
  {
    id: "basic-tech",
    name: "Basic Technology",
    emoji: "🛠️",
    tint: "from-amber-100 to-amber-50",
    accent: "from-amber-500 to-amber-700",
    iconTint: "bg-amber-100",
    progress: 25,
    topics: [
      "Drawing Instruments",
      "Materials and Their Uses",
      "Simple Machines",
      "Building Materials",
      "Safety Rules in the Workshop",
    ],
  },
  {
    id: "social-studies",
    name: "Social Studies",
    emoji: "🌍",
    tint: "from-violet-100 to-violet-50",
    accent: "from-violet-500 to-violet-700",
    iconTint: "bg-violet-100",
    progress: 60,
    topics: [
      "The Family",
      "Culture and Identity",
      "Nigerian History",
      "Government",
      "Citizenship",
    ],
  },
  {
    id: "civic-education",
    name: "Civic Education",
    emoji: "⚖️",
    tint: "from-cyan-100 to-cyan-50",
    accent: "from-cyan-500 to-cyan-700",
    iconTint: "bg-cyan-100",
    progress: 30,
    topics: [
      "Rights and Duties",
      "Democracy",
      "National Symbols",
      "Discipline",
      "Honesty and Integrity",
    ],
  },
  {
    id: "computer-studies",
    name: "Computer Studies",
    emoji: "💻",
    tint: "from-indigo-100 to-indigo-50",
    accent: "from-indigo-500 to-indigo-700",
    iconTint: "bg-indigo-100",
    progress: 80,
    topics: [
      "Introduction to Computers",
      "Parts of a Computer",
      "Computer Hardware",
      "Software",
      "Internet Safety",
      "History of Computers",
    ],
  },
  {
    id: "agricultural-science",
    name: "Agricultural Science",
    emoji: "🌾",
    tint: "from-lime-100 to-lime-50",
    accent: "from-lime-500 to-lime-700",
    iconTint: "bg-lime-100",
    progress: 15,
    topics: [
      "Crop Production",
      "Animal Production",
      "Farm Tools",
      "Types of Soil",
      "Importance of Agriculture",
    ],
  },
  {
    id: "business-studies",
    name: "Business Studies",
    emoji: "💼",
    tint: "from-orange-100 to-orange-50",
    accent: "from-orange-500 to-orange-700",
    iconTint: "bg-orange-100",
    progress: 50,
    topics: [
      "Introduction to Business",
      "Trade",
      "Commerce",
      "Office Practice",
      "Money and Banking",
    ],
  },
];

export function findSubject(id) {
  return SUBJECTS.find((s) => s.id === id) || SUBJECTS[0];
}

// Encode a subject+topic into a /lesson URL.
export function lessonHref(subjectId, topic) {
  const qs = new URLSearchParams();
  if (subjectId) qs.set("subject", subjectId);
  if (topic) qs.set("topic", topic);
  return `/lesson?${qs.toString()}`;
}
