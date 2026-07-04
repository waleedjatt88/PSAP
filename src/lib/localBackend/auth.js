import bcrypt from "bcryptjs";
import {
  getUsers,
  saveUsers,
  getOtps,
  saveOtps,
  newId,
  generateOtp,
  toPublicUser,
} from "./store.js";

// Browser-only stand-in for the old MongoDB + JWT auth backend. Everything
// lives in this visitor's localStorage — there is no shared account
// database, so "signing up" only creates an account on this device/browser.
// There's nothing to keep secret server-side anymore, so OTPs are returned
// straight back to the caller (and shown on-screen) instead of emailed.

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const OTP_EXPIRY_MINUTES = 10;
const RESEND_COOLDOWN_MS = 30 * 1000;

function err(message, status = 400, extra = {}) {
  const e = new Error(message);
  e.status = status;
  Object.assign(e, extra);
  return e;
}

function findUserByEmail(email) {
  return getUsers().find((u) => u.email === email.toLowerCase().trim());
}

function latestOtp(email, purpose) {
  const normalized = email.toLowerCase().trim();
  return getOtps()
    .filter((o) => o.email === normalized && o.purpose === purpose && !o.consumed)
    .sort((a, b) => b.createdAt - a.createdAt)[0];
}

function issueOtp({ email, purpose, payload = null }) {
  const normalizedEmail = email.toLowerCase().trim();
  const recent = latestOtp(normalizedEmail, purpose);
  if (recent && Date.now() - recent.createdAt < RESEND_COOLDOWN_MS) {
    const waitSeconds = Math.ceil((RESEND_COOLDOWN_MS - (Date.now() - recent.createdAt)) / 1000);
    throw err(`Please wait ${waitSeconds}s before requesting another code.`, 429);
  }

  const otp = generateOtp();
  const otps = getOtps();
  otps.push({
    id: newId(),
    email: normalizedEmail,
    purpose,
    otp,
    attempts: 0,
    verified: false,
    consumed: false,
    ticketSecret: null,
    expiresAt: Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000,
    payload,
    createdAt: Date.now(),
  });
  saveOtps(otps);

  return { otp, expiryMinutes: OTP_EXPIRY_MINUTES };
}

function verifyOtpCode({ email, otp, purpose }) {
  const normalizedEmail = email.toLowerCase().trim();
  const otps = getOtps();
  const doc = otps
    .filter((o) => o.email === normalizedEmail && o.purpose === purpose && !o.consumed)
    .sort((a, b) => b.createdAt - a.createdAt)[0];

  if (!doc) throw err("No pending verification code for this email. Request a new one.");
  if (doc.expiresAt < Date.now()) throw err("This code has expired. Request a new one.");
  if (doc.attempts >= 5) throw err("Too many incorrect attempts. Request a new code.", 429);

  if (doc.otp !== String(otp).trim()) {
    doc.attempts += 1;
    saveOtps(otps);
    throw err("Incorrect code. Please try again.");
  }

  doc.verified = true;

  if (purpose === "signup") {
    doc.consumed = true;
    if (!doc.payload) throw err("This signup has expired. Please sign up again.");

    const users = getUsers();
    const existingIdx = users.findIndex((u) => u.email === normalizedEmail);
    const user = {
      id: existingIdx >= 0 ? users[existingIdx].id : newId(),
      email: normalizedEmail,
      ...doc.payload,
      isVerified: true,
    };
    if (existingIdx >= 0) users[existingIdx] = user;
    else users.push(user);
    saveUsers(users);
    saveOtps(otps);
    return { verified: true, user };
  }

  // purpose === "reset": issue a one-time ticket for /reset-password.
  const ticketSecret = newId();
  doc.ticketSecret = ticketSecret;
  saveOtps(otps);
  return { verified: true, resetTicket: `${doc.id}.${ticketSecret}` };
}

function consumeResetTicket({ ticket }) {
  const [id, secret] = String(ticket || "").split(".");
  if (!id || !secret) throw err("Invalid or expired reset ticket.");

  const otps = getOtps();
  const doc = otps.find((o) => o.id === id);
  if (
    !doc ||
    doc.purpose !== "reset" ||
    !doc.verified ||
    doc.consumed ||
    doc.ticketSecret !== secret ||
    doc.expiresAt < Date.now()
  ) {
    throw err("Invalid or expired reset ticket.");
  }

  const users = getUsers();
  const idx = users.findIndex((u) => u.email === doc.email);
  if (idx < 0) throw err("No account found for this email.", 404);

  doc.consumed = true;
  saveOtps(otps);
  return { users, idx };
}

// Session "tokens" are just the user id — there's no server to forge a
// signature against, so a JWT would add complexity without adding safety.
function getUserIdFromAuthHeader(headers) {
  const header = headers?.Authorization || headers?.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : null;
}

export function signup({ fullName, email, password, classLevel }) {
  if (!fullName || !String(fullName).trim()) throw err("Full name is required");
  if (!email || !EMAIL_RE.test(email)) throw err("Missing or invalid email");
  if (!password || String(password).length < 6) throw err("Password must be at least 6 characters");

  const normalizedEmail = email.toLowerCase().trim();
  if (findUserByEmail(normalizedEmail)) {
    throw err("An account with this email already exists.", 409);
  }

  const passwordHash = bcrypt.hashSync(password, 10);
  const { otp, expiryMinutes } = issueOtp({
    email: normalizedEmail,
    purpose: "signup",
    payload: { fullName: fullName.trim(), passwordHash, classLevel: classLevel || null },
  });

  return { status: 201, body: { ok: true, email: normalizedEmail, otp, expiryMinutes } };
}

export function login({ email, password }) {
  const INVALID_MSG = "Invalid email or password";
  if (!email || !EMAIL_RE.test(email) || !password) throw err(INVALID_MSG);

  const user = findUserByEmail(email);
  if (!user || !bcrypt.compareSync(password, user.passwordHash)) throw err(INVALID_MSG, 401);

  if (!user.isVerified) {
    throw err("Please verify your email before signing in.", 403, {
      needsVerification: true,
      email: user.email,
    });
  }

  return { status: 200, body: { token: user.id, user: toPublicUser(user) } };
}

export function me({ headers }) {
  const userId = getUserIdFromAuthHeader(headers);
  if (!userId) throw err("Not signed in", 401);
  const user = getUsers().find((u) => u.id === userId);
  if (!user) throw err("Not signed in", 401);
  return { status: 200, body: { user: toPublicUser(user) } };
}

export function updateProfile({ headers, body }) {
  const userId = getUserIdFromAuthHeader(headers);
  if (!userId) throw err("Not signed in", 401);

  const users = getUsers();
  const idx = users.findIndex((u) => u.id === userId);
  if (idx < 0) throw err("Not signed in", 401);

  const { name, classLevel, avatar } = body || {};
  if (name !== undefined) users[idx].fullName = name;
  if (classLevel !== undefined) users[idx].classLevel = classLevel;
  if (avatar !== undefined) users[idx].avatarUrl = avatar;
  saveUsers(users);

  return { status: 200, body: { user: toPublicUser(users[idx]) } };
}

export function resendOtp({ email, purpose }) {
  if (!email || !EMAIL_RE.test(email)) throw err("Missing or invalid email");
  if (purpose !== "signup" && purpose !== "reset") throw err("Invalid purpose");

  const normalizedEmail = email.toLowerCase().trim();
  let payload = null;
  if (purpose === "signup") {
    const prior = latestOtp(normalizedEmail, "signup");
    if (!prior?.payload) throw err("No pending signup found. Please sign up again.");
    payload = prior.payload;
  }

  const result = issueOtp({ email: normalizedEmail, purpose, payload });
  return { status: 200, body: { ok: true, ...result } };
}

export function verifyOtp({ email, otp, purpose }) {
  if (!email || !EMAIL_RE.test(email)) throw err("Missing or invalid email");
  if (!otp || !/^\d{6}$/.test(String(otp).trim())) throw err("Enter the 6-digit code");
  if (purpose !== "signup" && purpose !== "reset") throw err("Invalid purpose");

  const result = verifyOtpCode({ email, otp, purpose });
  if (purpose === "signup" && result.user) {
    return {
      status: 200,
      body: { verified: true, token: result.user.id, user: toPublicUser(result.user) },
    };
  }
  return { status: 200, body: result };
}

export function forgotPassword({ email }) {
  const GENERIC_MESSAGE = "If an account exists for this email, a reset code has been sent.";
  if (!email || !EMAIL_RE.test(email)) throw err("Missing or invalid email");

  const user = findUserByEmail(email);
  let otp = null;
  if (user && user.isVerified) {
    otp = issueOtp({ email, purpose: "reset" }).otp;
  }

  return { status: 200, body: { ok: true, message: GENERIC_MESSAGE, otp } };
}

// Seeds a fixed demo account on first load so anyone opening the app can
// sign in immediately without going through signup/OTP. Idempotent — runs
// on every app load but only creates the account once per browser.
export function ensureDemoUser() {
  const email = "poojitha@passpoint.ai";
  const users = getUsers();
  if (users.some((u) => u.email === email)) return;

  users.push({
    id: newId(),
    email,
    fullName: "Poojitha",
    passwordHash: bcrypt.hashSync("demo1234", 10),
    classLevel: "JSS 1",
    avatarUrl: null,
    isVerified: true,
  });
  saveUsers(users);
}

export function resetPassword({ ticket, newPassword }) {
  if (!ticket || typeof ticket !== "string") throw err("Missing reset ticket");
  if (!newPassword || String(newPassword).length < 6) {
    throw err("Password must be at least 6 characters");
  }

  const { users, idx } = consumeResetTicket({ ticket });
  users[idx].passwordHash = bcrypt.hashSync(newPassword, 10);
  saveUsers(users);

  return { status: 200, body: { ok: true } };
}
