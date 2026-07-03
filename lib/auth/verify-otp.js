import { verifyOtpCode } from "../otpService.js";
import { signToken, toPublicUser } from "../auth.js";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// POST /api/auth/verify-otp { email, otp, purpose: "signup" | "reset" }
// For purpose "reset", a successful verify returns a one-time `resetTicket`
// that must be passed to /api/auth/reset-password.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { email, otp, purpose } = req.body || {};
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: "Missing or invalid email" });
    }
    if (!otp || !/^\d{6}$/.test(String(otp).trim())) {
      return res.status(400).json({ error: "Enter the 6-digit code" });
    }
    if (purpose !== "signup" && purpose !== "reset") {
      return res.status(400).json({ error: "Invalid purpose" });
    }

    const result = await verifyOtpCode({ email, otp, purpose });
    if (purpose === "signup" && result.user) {
      return res.status(200).json({
        verified: true,
        token: signToken(result.user._id),
        user: toPublicUser(result.user),
      });
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error("[verify-otp] error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Verification failed" });
  }
}
