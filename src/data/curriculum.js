// Demo curriculum — intentionally narrow.
// Two subjects, one topic each, each topic pointing at a static lesson
// in /src/data/lessons/. The AI presents these lessons word-for-word.

export const SUBJECTS = [
  {
    id: "mathematics",
    name: "Mathematics",
    emoji: "📐",
    image: "math",
    tint: "from-blue-100 to-blue-50",
    accent: "from-blue-500 to-blue-700",
    iconTint: "bg-blue-100",
    progress: 0,
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
    emoji: "🌱",
    image: "science",
    tint: "from-emerald-100 to-emerald-50",
    accent: "from-emerald-500 to-emerald-700",
    iconTint: "bg-emerald-100",
    progress: 0,
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
