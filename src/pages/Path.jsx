import { useParams, Link, Navigate } from "react-router-dom";
import { getLearningPath } from "../data/learningPaths";

// Landing page for a learning path (SS3, JAMB, …).
// For classes this will show 3 Terms → Scheme of Work → Topics.
// For exams this will show Past Questions grouped by year.
// For now it shows the shell; the term/topic tree + subscriptions land in
// a future sprint once curriculum data + billing are wired up.
export default function Path() {
  const { id } = useParams();
  const path = getLearningPath(id);

  if (!path) {
    return <Navigate to="/dashboard" replace />;
  }

  const kindLabel = path.kind === "exam" ? "Past Questions" : "Terms & Scheme of Work";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${path.colorTint || "bg-ink-100"}`}>
          {path.icon || "📚"}
        </div>
        <div>
          <div className="text-xs text-ink-500 uppercase tracking-wide">
            {path.kind === "exam" ? "Examination" : "Class"}
          </div>
          <h1 className="text-2xl font-extrabold text-ink-900">{path.name}</h1>
          {path.description && (
            <p className="text-sm text-ink-500">{path.description}</p>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="font-bold mb-3">{kindLabel}</div>
        <p className="text-sm text-ink-500">
          {path.kind === "exam"
            ? "Browse past questions by year (1999, 2005, 2016, …). Coming soon."
            : "3 Terms · each with its own Scheme of Work · ~12 topics per term. Coming soon."}
        </p>
        <Link
          to="/subjects"
          className="inline-block mt-4 bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-full"
        >
          Open subjects (demo) →
        </Link>
      </div>
    </div>
  );
}
