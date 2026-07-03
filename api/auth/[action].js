// Single dispatcher for all /api/auth/* routes.
//
// Vercel Hobby plan caps at 12 serverless functions per deployment. Instead of
// shipping one function per auth endpoint, we bundle all 8 into a dynamic
// route: `/api/auth/[action]` maps to the `action` URL param, which we use to
// pick the right handler. The handlers themselves live in /lib/auth/ so they
// don't count as functions.
import signupHandler from "../../lib/auth/signup.js";
import loginHandler from "../../lib/auth/login.js";
import meHandler from "../../lib/auth/me.js";
import updateProfileHandler from "../../lib/auth/update-profile.js";
import resendOtpHandler from "../../lib/auth/resend-otp.js";
import verifyOtpHandler from "../../lib/auth/verify-otp.js";
import forgotPasswordHandler from "../../lib/auth/forgot-password.js";
import resetPasswordHandler from "../../lib/auth/reset-password.js";

const HANDLERS = {
  signup: signupHandler,
  login: loginHandler,
  me: meHandler,
  "update-profile": updateProfileHandler,
  "resend-otp": resendOtpHandler,
  "verify-otp": verifyOtpHandler,
  "forgot-password": forgotPasswordHandler,
  "reset-password": resetPasswordHandler,
};

export default async function handler(req, res) {
  const action = req.query?.action;
  const fn = HANDLERS[action];
  if (!fn) {
    return res.status(404).json({ error: `Unknown auth action: ${action}` });
  }
  return fn(req, res);
}
