import bcrypt from "bcryptjs";
import { consumeResetTicket } from "../otpService.js";
import { sendTemplateEmail } from "../mailer.js";

// POST /api/auth/reset-password { ticket, newPassword }
// `ticket` comes from a successful /api/auth/verify-otp?purpose=reset call.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const { ticket, newPassword } = req.body || {};
    if (!ticket || typeof ticket !== "string") {
      return res.status(400).json({ error: "Missing reset ticket" });
    }
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    const { user } = await consumeResetTicket({ ticket });
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();

    sendTemplateEmail({
      to: user.email,
      subject: `${process.env.APP_NAME || "PassPoint AI"} · Your password was changed`,
      template: "reset-success",
      data: { email: user.email },
    }).catch((err) => console.error("[reset-password] confirmation email failed:", err.message));

    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error("[reset-password] error:", err);
    return res.status(err.status || 500).json({ error: err.message || "Failed to reset password" });
  }
}
