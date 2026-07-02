import bcrypt from "bcryptjs";
import { connectToDatabase } from "../../lib/mongodb.js";
import User from "../../models/User.js";
import { issueAndSendOtp } from "../../lib/otpService.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// POST /api/auth/signup { fullName, email, password, classLevel }
// Does NOT create a User yet — signup details are held against the OTP
// record and only turned into an account once /api/auth/verify-otp
// confirms the email. Nothing lands in the users collection until then.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { fullName, email, password, classLevel } = req.body || {};
    if (!fullName || !String(fullName).trim()) {
      return res.status(400).json({ error: "Full name is required" });
    }
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Missing or invalid email" });
    }
    if (!password || String(password).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    await connectToDatabase();
    const normalizedEmail = email.toLowerCase().trim();

    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ error: "An account with this email already exists." });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await issueAndSendOtp({
      email: normalizedEmail,
      purpose: "signup",
      payload: { fullName: fullName.trim(), passwordHash, classLevel: classLevel || null },
    });

    return res.status(201).json({ ok: true, email: normalizedEmail });
  } catch (err) {
    console.error("[signup] error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Signup failed" });
  }
}
