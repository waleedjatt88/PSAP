import { useEffect, useState } from "react";
import { useParams, Link, Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";

// Landing page for a subscribed learning path (SS3, JAMB, …).
// For classes this will show 3 Terms → Scheme of Work → Topics.
// For exams this will show Past Questions grouped by year.
// For now it verifies entitlement + shows the shell; the term/topic
// tree lives in the next sprint once we've imported curriculum data.
export default function Path() {
  const { id } = useParams();
  const [path, setPath] = useState(null);
  const [entitled, setEntitled] = useState(null);   // null = loading, true/false = resolved
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [{ data: pathRow, error: pErr }, { data: subs, error: sErr }] =
        await Promise.all([
          supabase.from("learning_paths").select("*").eq("id", id).maybeSingle(),
          supabase
            .from("subscriptions")
            .select("id")
            .eq("learning_path_id", id)
            .eq("status", "active"),
        ]);
      if (cancelled) return;
      if (pErr || sErr) {
        setError((pErr || sErr).message);
        setEntitled(false);
        return;
      }
      setPath(pathRow);
      setEntitled(Boolean(subs && subs.length > 0));
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (entitled === null) {
    return <div className="text-sm text-ink-500">Loading…</div>;
  }
  if (error) {
    return <div className="text-sm text-red-600">{error}</div>;
  }
  if (!path) {
    return <Navigate to="/dashboard" replace />;
  }
  if (!entitled) {
    return (
      <div className="max-w-lg mx-auto text-center bg-white rounded-2xl shadow-card p-8">
        <div className="text-4xl mb-2">🔒</div>
        <div className="font-bold text-ink-900">You are not subscribed to {path.name}</div>
        <p className="text-sm text-ink-500 mt-1">
          Subscribe to unlock this learning path.
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-4 text-sm font-semibold text-brand-blue hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const kindLabel = path.kind === "exam" ? "Past Questions" : "Terms & Scheme of Work";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl ${path.color_tint || "bg-ink-100"}`}>
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
