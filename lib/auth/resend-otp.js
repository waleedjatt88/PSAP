import { connectToDatabase } from "../mongodb.js";
import EmailVerification from "../../models/EmailVerification.js";
import { issueAndSendOtp } from "../otpService.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// POST /api/auth/resend-otp { email, purpose: "signup" | "reset" }
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email, purpose } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Missing or invalid email" });
    }
    if (purpose !== "signup" && purpose !== "reset") {
      return res.status(400).json({ error: "Invalid purpose" });
    }

    const normalizedEmail = email.toLowerCase().trim();
    let payload = null;
    if (purpose === "signup") {
      // No User exists yet for a pending signup — recover the original
      // signup details from the most recent OTP record instead of asking
      // the client to resend them.
      await connectToDatabase();
      const prior = await EmailVerification.findOne({ email: normalizedEmail, purpose }).sort({
        createdAt: -1,
      });
      if (!prior?.payload) {
        return res.status(400).json({ error: "No pending signup found. Please sign up again." });
      }
      payload = prior.payload;
    }

    const result = await issueAndSendOtp({ email: normalizedEmail, purpose, payload });
    return res.status(200).json({ ok: true, ...result });
  } catch (err) {
    console.error("[resend-otp] error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to resend code" });
  }
}
