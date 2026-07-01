// Grants (or revokes) subscriptions for the authenticated user.
//
// In production this is called by the Paystack webhook after a successful
// payment. For the stakeholder demo we also expose a `demo` flag that lets
// a signed-in user grant themselves the standard demo bundle without
// paying. Gate that behind DEMO_MODE=true in .env so it can't ship live.
import { getSupabaseAdmin, getUserFromRequest } from "../lib/supabaseAdmin.js";

const DEMO_BUNDLE = ["ss3", "jamb", "waec", "neco", "gce"];

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const user = await getUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: "Not signed in" });
  }

  const { paths, demo } = req.body || {};

  let requested = Array.isArray(paths) ? paths.filter((p) => typeof p === "string") : [];
  if (demo) {
    if (process.env.DEMO_MODE !== "true") {
      return res.status(403).json({ error: "Demo subscriptions are disabled on this environment" });
    }
    requested = [...new Set([...requested, ...DEMO_BUNDLE])];
  }

  if (requested.length === 0) {
    return res.status(400).json({ error: "No learning paths supplied" });
  }

  const admin = getSupabaseAdmin();

  // Validate that every requested path exists in the catalog so we can't
  // create dangling subscription rows.
  const { data: catalog, error: catErr } = await admin
    .from("learning_paths")
    .select("id")
    .in("id", requested);
  if (catErr) {
    return res.status(500).json({ error: catErr.message });
  }
  const valid = new Set(catalog.map((r) => r.id));
  const rows = requested
    .filter((id) => valid.has(id))
    .map((id) => ({
      user_id: user.id,
      learning_path_id: id,
      status: "active",
      started_at: new Date().toISOString(),
      expires_at: null,
    }));

  if (rows.length === 0) {
    return res.status(400).json({ error: "None of the supplied paths exist in the catalog" });
  }

  // Upsert on (user_id, learning_path_id) unique constraint — re-activates
  // an expired sub instead of erroring.
  const { error } = await admin
    .from("subscriptions")
    .upsert(rows, { onConflict: "user_id,learning_path_id" });

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  return res.status(200).json({ ok: true, granted: rows.map((r) => r.learning_path_id) });
}
