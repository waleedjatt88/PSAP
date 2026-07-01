// Server-only Supabase client. Uses the SERVICE ROLE key, which bypasses RLS.
// NEVER import this from anything under /src — that would bundle the service
// role key into the browser.
import { createClient } from "@supabase/supabase-js";

let cached = null;

export function getSupabaseAdmin() {
  if (cached) return cached;

  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      "Supabase admin is not configured. Set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.",
    );
  }

  cached = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cached;
}

// Verify a JWT sent by the browser (Authorization: Bearer <token>) and return
// the user, or null if invalid/expired. Used by API routes to know who is
// making the call without trusting client-sent user ids.
export async function getUserFromRequest(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;

  const admin = getSupabaseAdmin();
  const { data, error } = await admin.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}
