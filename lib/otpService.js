import { connectToDatabase } from "./mongodb.js";
import EmailVerification from "../models/EmailVerification.js";
import User from "../models/User.js";
import { generateOtp, hashValue, generateTicketSecret } from "./otp.js";
import { sendTemplateEmail } from "./mailer.js";

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 10);
const RESEND_COOLDOWN_MS = 30 * 1000;
const MAX_ATTEMPTS = 5;

const HEADINGS = {
  signup: {
    heading: "Verify your email",
    subheading: "Use the code below to confirm your email and finish creating your PassPoint account.",
  },
  reset: {
    heading: "Reset your password",
    subheading: "Use the code below to verify it's you and choose a new password.",
  },
};

export async function issueAndSendOtp({ email, purpose, payload = null }) {
  await connectToDatabase();
  const normalizedEmail = email.toLowerCase().trim();

  const recent = await EmailVerification.findOne({ email: normalizedEmail, purpose }).sort({
    createdAt: -1,
  });
  if (recent && Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil(
      (RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt.getTime())) / 1000
    );
    const err = new Error(`Please wait ${waitSeconds}s before requesting another code.`);
    err.status = 429;
    throw err;
  }

  const otp = generateOtp();
  await EmailVerification.create({
    email: normalizedEmail,
    purpose,
    otpHash: hashValue(otp),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
    payload,
  });

  const copy = HEADINGS[purpose];
  await sendTemplateEmail({
    to: normalizedEmail,
    subject: `${process.env.APP_NAME || "PassPoint AI"} · Your verification code`,
    template: "otp",
    data: { ...copy, otp, expiryMinutes: OTP_EXPIRY_MINUTES },
  });

  return { expiryMinutes: OTP_EXPIRY_MINUTES };
}

export async function verifyOtpCode({ email, otp, purpose }) {
  await connectToDatabase();
  const normalizedEmail = email.toLowerCase().trim();

  const doc = await EmailVerification.findOne({
    email: normalizedEmail,
    purpose,
    consumed: false,
  }).sort({ createdAt: -1 });

  if (!doc) {
    const err = new Error("No pending verification code for this email. Request a new one.");
    err.status = 400;
    throw err;
  }
  if (doc.expiresAt.getTime() < Date.now()) {
    const err = new Error("This code has expired. Request a new one.");
    err.status = 400;
    throw err;
  }
  if (doc.attempts >= MAX_ATTEMPTS) {
    const err = new Error("Too many incorrect attempts. Request a new code.");
    err.status = 429;
    throw err;
  }
  if (doc.otpHash !== hashValue(String(otp).trim())) {
    doc.attempts += 1;
    await doc.save();
    const err = new Error("Incorrect code. Please try again.");
    err.status = 400;
    throw err;
  }

  doc.verified = true;

  if (purpose === "signup") {
    doc.consumed = true;
    await doc.save();

    if (!doc.payload) {
      const err = new Error("This signup has expired. Please sign up again.");
      err.status = 400;
      throw err;
    }

    // Someone could finish two signup attempts for the same email in
    // parallel — last verified one wins, keep the account single-row.
    const existing = await User.findOne({ email: normalizedEmail });
    const user = existing
      ? Object.assign(existing, { ...doc.payload, isVerified: true })
      : new User({ ...doc.payload, email: normalizedEmail, isVerified: true });
    await user.save();

    return { verified: true, user };
  }

  // purpose === "reset": issue a one-time ticket authorizing the password
  // change, without letting the client hold the OTP itself any longer than
  // needed.
  const ticketSecret = generateTicketSecret();
  doc.ticketSecretHash = hashValue(ticketSecret);
  await doc.save();
  return { verified: true, resetTicket: `${doc._id}.${ticketSecret}` };
}

export async function consumeResetTicket({ ticket }) {
  await connectToDatabase();
  const [id, secret] = String(ticket || "").split(".");
  if (!id || !secret) {
    const err = new Error("Invalid or expired reset ticket.");
    err.status = 400;
    throw err;
  }

  const doc = await EmailVerification.findById(id);
  if (
    !doc ||
    doc.purpose !== "reset" ||
    !doc.verified ||
    doc.consumed ||
    !doc.ticketSecretHash ||
    doc.ticketSecretHash !== hashValue(secret) ||
    doc.expiresAt.getTime() < Date.now()
  ) {
    const err = new Error("Invalid or expired reset ticket.");
    err.status = 400;
    throw err;
  }

  const user = await User.findOne({ email: doc.email });
  if (!user) {
    const err = new Error("No account found for this email.");
    err.status = 404;
    throw err;
  }

  doc.consumed = true;
  await doc.save();

  return { user };
}
