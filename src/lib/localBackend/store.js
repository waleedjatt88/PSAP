// Tiny localStorage-backed collections standing in for the MongoDB
// collections we used to have (users, OTP records). Everything here runs
// in the visitor's own browser — there is no shared/server database.

const USERS_KEY = "pp_local_users";
const OTPS_KEY = "pp_local_otps";
const SESSION_KEY = "pp_token";

function readJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getUsers() {
  return readJSON(USERS_KEY, []);
}

export function saveUsers(users) {
  writeJSON(USERS_KEY, users);
}

export function getOtps() {
  return readJSON(OTPS_KEY, []);
}

export function saveOtps(otps) {
  writeJSON(OTPS_KEY, otps);
}

export function getSessionToken() {
  return localStorage.getItem(SESSION_KEY);
}

export function setSessionToken(token) {
  if (token) localStorage.setItem(SESSION_KEY, token);
  else localStorage.removeItem(SESSION_KEY);
}

export function newId() {
  return crypto.randomUUID();
}

export function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export function toPublicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.fullName,
    classLevel: user.classLevel,
    avatar: user.avatarUrl,
    isVerified: user.isVerified,
  };
}
