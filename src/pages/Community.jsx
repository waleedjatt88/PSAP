import { Link, useParams } from "react-router-dom";
import { getLearningPath } from "../data/learningPaths";

// Per-path community. Posting + moderation depend on a real subscriptions
// model that hasn't been built yet (see Path.jsx) — this shows the shell
// for now instead of a broken form.
export default function Community() {
  const { pathId } = useParams();
  const path = getLearningPath(pathId);

  if (!path) {
    return (
      <div className="max-w-lg mx-auto text-center bg-white rounded-2xl shadow-card p-8">
        <div className="text-4xl mb-2">🤷</div>
        <div className="font-bold text-ink-900">Community not found</div>
        <Link to="/dashboard" className="inline-block mt-4 text-sm font-semibold text-brand-blue hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${path.colorTint || "bg-ink-100"}`}>
          {path.icon || "💬"}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{path.name} Community</h1>
          <p className="text-sm text-ink-500">Academic discussion for {path.name}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-card p-8 text-center">
        <div className="text-4xl mb-2">💬</div>
        <div className="font-bold text-ink-900">Coming soon</div>
        <p className="text-sm text-ink-500 mt-1">
          Discussions open up once subscriptions launch for this path.
        </p>
      </div>
    </div>
  );
}
