import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useUser } from "../store/user";
import { supabase } from "../lib/supabase";
import { apiFetch } from "../lib/api";
import { TargetIcon, FlameIcon, BookIcon, StarIcon } from "../components/icons";
import heroImg from "../assets/hero.png";

const stats = [
  { label: "Today Goal", value: "20 min", trend: "+8%", icon: TargetIcon, tint: "bg-blue-100 text-brand-blue" },
  { label: "Current Streak", value: "6 days", trend: "+1", icon: FlameIcon, tint: "bg-orange-100 text-brand-orange" },
  { label: "Lesson Completed", value: "3", trend: "+2", icon: BookIcon, tint: "bg-green-100 text-emerald-600" },
  { label: "Total Points", value: "120", trend: "+15", icon: StarIcon, tint: "bg-purple-100 text-purple-600" },
];

// Fetches every learning_path the current user is actively subscribed to,
// plus the community row for each one. Uses the join expression so it's a
// single round-trip; RLS on subscriptions guarantees we only see our own.
async function loadMyPaths() {
  const { data, error } = await supabase
    .from("subscriptions")
    .select(`
      learning_path_id,
      status,
      expires_at,
      learning_paths (
        id, name, kind, description, icon, color_tint, sort_order,
        communities ( id, name )
      )
    `)
    .eq("status", "active")
    .order("created_at", { ascending: true });

  if (error) throw error;

  return (data || [])
    .map((row) => row.learning_paths)
    .filter(Boolean)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export default function Dashboard() {
  const { user } = useUser();
  const [paths, setPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [granting, setGranting] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setPaths(await loadMyPaths());
    } catch (err) {
      setError(err.message || "Could not load your learning paths");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const grantDemoAccess = async () => {
    setGranting(true);
    try {
      await apiFetch("/api/subscribe", {
        method: "POST",
        body: JSON.stringify({ demo: true }),
      });
      await refresh();
    } catch (err) {
      setError(err.message || "Could not grant demo access");
    } finally {
      setGranting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="bg-gradient-to-r from-blue-50 via-white to-orange-50 rounded-2xl p-4 sm:p-6 flex items-center justify-between shadow-card overflow-hidden gap-3">
        <div className="max-w-md min-w-0">
          <h1 className="text-xl sm:text-2xl font-extrabold text-ink-900">
            Good Morning, {user?.name?.split(" ")[0] || "Student"}
          </h1>
          <p className="text-ink-500 mt-1">
            {paths.length > 0
              ? <>You have <strong>{paths.length} learning path{paths.length === 1 ? "" : "s"}</strong> ready to continue.</>
              : <>Get started by choosing what you want to learn.</>}
          </p>
        </div>
        <img
          src={heroImg}
          alt="PassPoint mascot"
          className="hidden md:block h-32 object-contain"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map(({ label, value, trend, icon: Icon, tint }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-4 shadow-card flex items-start justify-between"
          >
            <div>
              <div className="text-xs text-ink-500">{label}</div>
              <div className="text-2xl font-bold mt-1">{value}</div>
              <div className="text-xs text-emerald-600 mt-1">▲ {trend}</div>
            </div>
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${tint}`}>
              <Icon className="w-5 h-5" />
            </div>
          </div>
        ))}
      </div>

      {/* My Learning Paths */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">My Learning Paths</h2>
          <Link to="/subjects" className="text-xs font-semibold text-brand-blue hover:underline">
            Browse catalog →
          </Link>
        </div>

        {loading && <PathsSkeleton />}

        {error && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && paths.length === 0 && (
          <EmptyState onGrant={grantDemoAccess} granting={granting} />
        )}

        {!loading && !error && paths.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {paths.map((p) => <PathCard key={p.id} path={p} />)}
          </div>
        )}
      </div>
    </div>
  );
}

function PathCard({ path }) {
  const community = path.communities?.[0];
  return (
    <div className="rounded-2xl p-5 shadow-card bg-white border border-ink-100 hover:shadow-soft transition-shadow">
      <div className="flex items-center gap-4">
        <div
          className={`w-16 h-16 rounded-xl flex items-center justify-center text-3xl shrink-0 ${path.color_tint || "bg-ink-100 text-ink-700"}`}
        >
          {path.icon || "📚"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-ink-500 uppercase tracking-wide">
            {path.kind === "exam" ? "Examination" : "Class"}
          </div>
          <div className="font-bold text-ink-900">{path.name}</div>
          {path.description && (
            <div className="text-xs text-ink-500 mt-0.5 line-clamp-2">{path.description}</div>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-4">
        <Link
          to={`/path/${path.id}`}
          className="flex-1 text-center bg-brand-blue hover:bg-brand-blue-dark text-white text-sm font-semibold px-4 py-2 rounded-full"
        >
          Continue →
        </Link>
        {community && (
          <Link
            to={`/community/${path.id}`}
            className="text-sm font-semibold px-4 py-2 rounded-full border border-brand-orange text-brand-orange hover:bg-brand-orange hover:text-white transition-colors"
          >
            Join Community
          </Link>
        )}
      </div>
    </div>
  );
}

function PathsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-2xl p-5 shadow-card border border-ink-100 animate-pulse">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-ink-100" />
            <div className="flex-1 space-y-2">
              <div className="h-3 bg-ink-100 rounded w-1/3" />
              <div className="h-4 bg-ink-100 rounded w-2/3" />
              <div className="h-3 bg-ink-100 rounded w-full" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ onGrant, granting }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-ink-200 bg-white p-8 text-center">
      <div className="text-4xl mb-2">📚</div>
      <div className="font-semibold text-ink-900">No active subscriptions yet</div>
      <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
        Once you subscribe to a class or examination, it will appear here for easy access.
      </p>
      <button
        onClick={onGrant}
        disabled={granting}
        className="mt-4 bg-brand-orange hover:bg-brand-orange-dark disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-full"
      >
        {granting ? "Granting…" : "Grant demo access (SS3, JAMB, WAEC, NECO, GCE)"}
      </button>
    </div>
  );
}
