// Shared by LessonSlide (worked-example visuals) and MathLectureSlide
// (equation-reveal visuals): figures out how many "steps" of a visual
// should be visible right now, based on the AI's current sentence and
// the section's `revealAtSentence` mapping.
export function computeRevealStep(section, sectionStartIdx, currentIdx) {
  if (!["worked-example", "equation-reveal"].includes(section.visual?.type)) return 0;
  const localIdx =
    currentIdx >= sectionStartIdx ? currentIdx - sectionStartIdx : -1;
  if (localIdx < 0) return 0;
  const stepsCount = section.visual.steps?.length || 0;
  const mapping = section.visual.revealAtSentence;
  if (Array.isArray(mapping) && mapping.length > 0) {
    if (localIdx >= mapping.length) return stepsCount + 1;
    return mapping[localIdx];
  }
  const total = section.sentences?.length || 1;
  return Math.min(stepsCount, Math.floor(((localIdx + 1) / total) * stepsCount));
}
