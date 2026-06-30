import fractions from "./fractions.js";
import livingThings from "./living-things.js";
import kgAlphabet from "./kindergarten-alphabet.js";
import kgNumbers from "./kindergarten-numbers.js";
import kgObjects from "./kindergarten-objects.js";
import kgShapes from "./kindergarten-shapes.js";
import kgScience from "./kindergarten-science.js";

// Registry of all available lessons. The lesson id is canonical — the
// curriculum points at one of these.
export const LESSONS = {
  [fractions.id]: fractions,
  [livingThings.id]: livingThings,
  [kgAlphabet.id]: kgAlphabet,
  [kgNumbers.id]: kgNumbers,
  [kgObjects.id]: kgObjects,
  [kgShapes.id]: kgShapes,
  [kgScience.id]: kgScience,
};

export function getLesson(id) {
  return LESSONS[id] || null;
}

// Flatten a lesson into a list of { sectionId, sectionHeading, sentenceIdx,
// text } records. The teleprompter speaks these in order and highlights
// the matching DOM node.
export function flattenLesson(lesson) {
  if (!lesson?.sections) return [];
  const flat = [];
  let sentenceIdx = 0;
  for (const section of lesson.sections) {
    for (const [i, text] of (section.sentences || []).entries()) {
      flat.push({
        idx: sentenceIdx++,
        sectionId: section.id,
        sectionHeading: section.heading,
        textIdxInSection: i,
        text,
      });
    }
  }
  return flat;
}

// Build a single big string of the lesson — used as the AI's only
// knowledge source when answering student questions.
export function lessonToPlainText(lesson) {
  if (!lesson?.sections) return "";
  return lesson.sections
    .map((s) => `## ${s.heading}\n${(s.sentences || []).join(" ")}`)
    .join("\n\n");
}
