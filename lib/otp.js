import crypto from "crypto";

export function generateOtp() {
  return crypto.randomInt(100000, 1000000).toString();
}

export function hashValue(value) {
  return crypto.createHash("sha256").update(value).digest("hex");
}

export function generateTicketSecret() {
  return crypto.randomBytes(24).toString("hex");
}
