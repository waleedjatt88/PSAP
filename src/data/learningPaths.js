// Static catalog of learning paths (SS3, JAMB, WAEC, NECO, GCE, …). This
// used to live in a Supabase table; now that auth + the rest of the backend
// run on MongoDB it's just a constant until curriculum content + a real
// subscriptions model are built.
export const LEARNING_PATHS = [
  { id: "ss3", name: "SS3 Curriculum", kind: "class", description: "Full Senior Secondary 3 syllabus", icon: "🎓", colorTint: "bg-blue-100 text-brand-blue" },
  { id: "ss2", name: "SS2 Curriculum", kind: "class", description: "Full Senior Secondary 2 syllabus", icon: "📘", colorTint: "bg-indigo-100 text-indigo-600" },
  { id: "ss1", name: "SS1 Curriculum", kind: "class", description: "Full Senior Secondary 1 syllabus", icon: "📗", colorTint: "bg-teal-100 text-teal-600" },
  { id: "jamb", name: "JAMB", kind: "exam", description: "Joint Admissions & Matriculation Board", icon: "🏛️", colorTint: "bg-orange-100 text-brand-orange" },
  { id: "waec", name: "WAEC", kind: "exam", description: "West African Examinations Council", icon: "📝", colorTint: "bg-emerald-100 text-emerald-600" },
  { id: "neco", name: "NECO", kind: "exam", description: "National Examinations Council", icon: "📓", colorTint: "bg-purple-100 text-purple-600" },
  { id: "gce", name: "GCE", kind: "exam", description: "General Certificate of Education", icon: "📜", colorTint: "bg-rose-100 text-rose-600" },
];

export function getLearningPath(id) {
  return LEARNING_PATHS.find((p) => p.id === id) || null;
}
