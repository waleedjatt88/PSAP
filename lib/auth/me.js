import { connectToDatabase } from "../mongodb.js";
import User from "../../models/User.js";
import { getUserIdFromRequest, toPublicUser } from "../auth.js";

// GET /api/auth/me — hydrates the client session from a stored JWT.
export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not signed in" });

    await connectToDatabase();
    const user = await User.findById(userId);
    if (!user) return res.status(401).json({ error: "Not signed in" });

    return res.status(200).json({ user: toPublicUser(user) });
  } catch (err) {
    console.error("[me] error:", err);
    return res.status(500).json({ error: "Failed to load session" });
  }
}
