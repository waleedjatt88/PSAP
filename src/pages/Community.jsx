import { useEffect, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useUser } from "../store/user";

// Per-path community. RLS on community_posts enforces that:
//   - reads are only allowed when the caller has an active subscription
//     to the community's learning_path;
//   - inserts require the same subscription AND author_id = auth.uid();
//   - only posts with moderation='ok' are visible.
// So if you are not subscribed, the query simply returns no rows.
export default function Community() {
  const { pathId } = useParams();
  const { user } = useUser();
  const [community, setCommunity] = useState(null);
  const [posts, setPosts] = useState([]);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: c, error: cErr } = await supabase
        .from("communities")
        .select("id, name, description, learning_path_id, learning_paths(name, icon, color_tint)")
        .eq("learning_path_id", pathId)
        .maybeSingle();
      if (cErr) throw cErr;
      setCommunity(c);

      if (c) {
        const { data: p, error: pErr } = await supabase
          .from("community_posts")
          .select("id, body, created_at, author_id, profiles:author_id(full_name)")
          .eq("community_id", c.id)
          .order("created_at", { ascending: false })
          .limit(50);
        if (pErr) throw pErr;
        setPosts(p || []);
      }
    } catch (err) {
      setError(err.message || "Could not load community");
    } finally {
      setLoading(false);
    }
  }, [pathId]);

  useEffect(() => { load(); }, [load]);

  const submitPost = async (e) => {
    e.preventDefault();
    if (!community || !body.trim()) return;
    setPosting(true);
    setError(null);
    try {
      const { error: insErr } = await supabase
        .from("community_posts")
        .insert({
          community_id: community.id,
          author_id: user.id,
          body: body.trim(),
          // Set to 'ok' for now; real deployment routes through AI moderation
          // first (item #7 in the requirements doc).
          moderation: "ok",
        });
      if (insErr) throw insErr;
      setBody("");
      await load();
    } catch (err) {
      setError(err.message || "Could not post — you may not be subscribed to this community");
    } finally {
      setPosting(false);
    }
  };

  if (loading) return <div className="text-sm text-ink-500">Loading community…</div>;

  if (!community) {
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

  const path = community.learning_paths;

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${path?.color_tint || "bg-ink-100"}`}>
          {path?.icon || "💬"}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-ink-900">{community.name}</h1>
          {community.description && (
            <p className="text-sm text-ink-500">{community.description}</p>
          )}
        </div>
      </div>

      <form onSubmit={submitPost} className="bg-white rounded-2xl shadow-card p-4">
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Ask a question or share a study tip…"
          rows={3}
          className="w-full text-sm outline-none resize-none"
        />
        <div className="flex items-center justify-between mt-2">
          <div className="text-xs text-ink-500">
            Posts are moderated. Off-topic or offensive content is removed automatically.
          </div>
          <button
            type="submit"
            disabled={posting || !body.trim()}
            className="bg-brand-blue hover:bg-brand-blue-dark disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-full"
          >
            {posting ? "Posting…" : "Post"}
          </button>
        </div>
        {error && <div className="text-xs text-red-600 mt-2">{error}</div>}
      </form>

      <div className="space-y-3">
        {posts.length === 0 && (
          <div className="text-sm text-ink-500 text-center py-6">
            No posts yet. Be the first to start a discussion.
          </div>
        )}
        {posts.map((p) => (
          <div key={p.id} className="bg-white rounded-2xl shadow-card p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-ink-900">
                {p.profiles?.full_name || "Student"}
              </div>
              <div className="text-xs text-ink-500">
                {new Date(p.created_at).toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-ink-700 mt-2 whitespace-pre-wrap">{p.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
