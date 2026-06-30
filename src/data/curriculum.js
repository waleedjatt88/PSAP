// Demo curriculum — intentionally narrow.
// Two subjects, one topic each, each topic pointing at a static lesson
// in /src/data/lessons/. The AI presents these lessons word-for-word.

export const SUBJECTS = [
  // ── Kindergarten tier (mostly visual, slow narration) ──────────────
  {
    id: "kg-literacy",
    name: "Letters",
    classTier: "kindergarten",
    emoji: "🔤",
    tint: "from-rose-200 to-pink-100",
    accent: "from-rose-500 to-pink-700",
    iconTint: "bg-rose-100",
    progress: 0,
    voiceGender: "female",
    presenterName: "Aunty Adesua · AI Tutor",
    topics: [
      {
        title: "A to Z Alphabet",
        lessonId: "kg-alphabet",
        description: "Learn every letter from A to Z with friendly pictures",
      },
    ],
  },
  {
    id: "kg-numeracy",
    name: "Numbers",
    classTier: "kindergarten",
    emoji: "🔢",
    tint: "from-amber-200 to-yellow-100",
    accent: "from-amber-500 to-orange-600",
    iconTint: "bg-amber-100",
    progress: 0,
    voiceGender: "female",
    presenterName: "Aunty Adesua · AI Tutor",
    topics: [
      {
        title: "Numbers 1 to 10",
        lessonId: "kg-numbers",
        description: "Count out loud from one to ten",
      },
    ],
  },
  {
    id: "kg-recognition",
    name: "What Is This?",
    classTier: "kindergarten",
    emoji: "👀",
    tint: "from-sky-200 to-cyan-100",
    accent: "from-sky-500 to-cyan-700",
    iconTint: "bg-sky-100",
    progress: 0,
    voiceGender: "female",
    presenterName: "Aunty Adesua · AI Tutor",
    topics: [
      {
        title: "Object Recognition",
        lessonId: "kg-objects",
        description: "Name the things you see every day",
      },
    ],
  },
  {
    id: "kg-maths",
    name: "Maths",
    classTier: "kindergarten",
    emoji: "🔷",
    tint: "from-blue-200 to-indigo-100",
    accent: "from-blue-500 to-indigo-700",
    iconTint: "bg-blue-100",
    progress: 0,
    voiceGender: "female",
    presenterName: "Aunty Adesua · AI Tutor",
    topics: [
      {
        title: "Shapes Around Us",
        lessonId: "kg-shapes",
        description: "Spot circles, squares, triangles and more",
      },
    ],
  },
  {
    id: "kg-science",
    name: "Science",
    classTier: "kindergarten",
    emoji: "🧒",
    tint: "from-emerald-200 to-teal-100",
    accent: "from-emerald-500 to-teal-700",
    iconTint: "bg-emerald-100",
    progress: 0,
    voiceGender: "female",
    presenterName: "Aunty Adesua · AI Tutor",
    topics: [
      {
        title: "My Body",
        lessonId: "kg-science-body",
        description: "Name parts of the body and what they do",
      },
    ],
  },

  // ── JSS tier (full lesson teaching) ────────────────────────────────
  {
    id: "mathematics",
    name: "Mathematics",
    classTier: "jss",
    emoji: "📐",
    image: "math",
    tint: "from-blue-100 to-blue-50",
    accent: "from-blue-500 to-blue-700",
    iconTint: "bg-blue-100",
    progress: 0,
    voiceGender: "male", // Math teacher uses a male voice
    presenterName: "Mr. Adebayo · AI Tutor",
    topics: [
      {
        title: "Fractions",
        lessonId: "jss1-math-fractions",
        description: "Meaning of fractions, types, equivalents, and conversions",
      },
    ],
  },
  {
    id: "basic-science",
    name: "Basic Science",
    classTier: "jss",
    emoji: "🌱",
    image: "science",
    tint: "from-emerald-100 to-emerald-50",
    accent: "from-emerald-500 to-emerald-700",
    iconTint: "bg-emerald-100",
    progress: 0,
    voiceGender: "female", // Science teacher uses a female voice
    presenterName: "Mrs. Adesua · AI Tutor",
    topics: [
      {
        title: "Living Things",
        lessonId: "jss1-basicscience-living-things",
        description: "Definition, characteristics (MRS GREN), and major groups",
      },
    ],
  },
];

export function findSubject(id) {
  return SUBJECTS.find((s) => s.id === id) || SUBJECTS[0];
}

export function findTopic(subjectId, topicTitle) {
  const subj = findSubject(subjectId);
  return subj.topics.find((t) => t.title === topicTitle) || subj.topics[0];
}

// Build a /lesson URL from a subject id + topic title.
export function lessonHref(subjectId, topicTitle) {
  const qs = new URLSearchParams();
  if (subjectId) qs.set("subject", subjectId);
  if (topicTitle) qs.set("topic", topicTitle);
  return `/lesson?${qs.toString()}`;
}
