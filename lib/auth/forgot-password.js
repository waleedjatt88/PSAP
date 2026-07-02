import { connectToDatabase } from "../mongodb.js";
import User from "../../models/User.js";
import { issueAndSendOtp } from "../otpService.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const GENERIC_MESSAGE = "If an account exists for this email, a reset code has been sent.";

// POST /api/auth/forgot-password { email }
// Always responds with a generic message regardless of whether the email
// is registered, so this endpoint can't be used to enumerate accounts.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Missing or invalid email" });
    }

    await connectToDatabase();
    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (user && user.isVerified) {
      await issueAndSendOtp({ email, purpose: "reset" });
    }

    return res.status(200).json({ ok: true, message: GENERIC_MESSAGE });
  } catch (err) {
    console.error("[forgot-password] error:", err);
    // Still return the generic message on unexpected errors — don't leak
    // internal failures (or account existence) to the client.
    return res.status(200).json({ ok: true, message: GENERIC_MESSAGE });
  }
}
