import jwt from "jsonwebtoken";

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is not defined. Set it in your environment variables.");
  return secret;
}

export function signToken(userId) {
  return jwt.sign({ sub: String(userId) }, getSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || "30d",
  });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, getSecret());
  } catch {
    return null;
  }
}

// Reads `Authorization: Bearer <token>` and returns the decoded payload's
// user id, or null if missing/invalid/expired.
export function getUserIdFromRequest(req) {
  const header = req.headers?.authorization || req.headers?.Authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  const payload = verifyToken(token);
  return payload?.sub || null;
}

export function toPublicUser(userDoc) {
  return {
    id: String(userDoc._id),
    email: userDoc.email,
    name: userDoc.fullName,
    classLevel: userDoc.classLevel,
    avatar: userDoc.avatarUrl,
    isVerified: userDoc.isVerified,
  };
}
