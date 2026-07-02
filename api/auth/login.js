import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import { signToken, toPublicUser } from "../../lib/auth.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const INVALID_MSG = "Invalid email or password";

// POST /api/auth/login { email, password }
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email, password } = req.body || {};
    if (!email || !EMAIL_RE.test(email) || !password) {
      return res.status(400).json({ error: INVALID_MSG });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(401).json({ error: INVALID_MSG });

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) return res.status(401).json({ error: INVALID_MSG });

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email before signing in.",
        needsVerification: true,
        email: user.email,
      });
    }

    const token = signToken(user._id);
    return res.status(200).json({ token, user: toPublicUser(user) });
  } catch (err) {
    console.error("[login] error:", err);
    return res.status(500).json({ error: "Login failed" });
  }
}
