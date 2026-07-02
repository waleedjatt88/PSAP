import { connectToDatabase } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import { getUserIdFromRequest, toPublicUser } from "../../lib/auth.js";

// POST /api/auth/update-profile { name?, classLevel?, avatar? }
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: "Not signed in" });

    await connectToDatabase();
    const { name, classLevel, avatar } = req.body || {};
    const patch = {};
    if (name !== undefined) patch.fullName = name;
    if (classLevel !== undefined) patch.classLevel = classLevel;
    if (avatar !== undefined) patch.avatarUrl = avatar;

    const user = await User.findByIdAndUpdate(userId, patch, { new: true });
    if (!user) return res.status(401).json({ error: "Not signed in" });

    return res.status(200).json({ user: toPublicUser(user) });
  } catch (err) {
    console.error("[update-profile] error:", err);
    return res.status(500).json({ error: "Failed to update profile" });
  }
}
