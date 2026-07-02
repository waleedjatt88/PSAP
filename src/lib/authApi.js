import { apiFetch } from "./api";

// MongoDB + JWT auth endpoints (signup, login, OTP verification,
// forgot/reset password, profile).
export function signup({ fullName, email, password, classLevel }) {
  return apiFetch("/api/auth/signup", {
    method: "POST",
    body: JSON.stringify({ fullName, email, password, classLevel }),
  });
}

export function login({ email, password }) {
  return apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export function fetchMe() {
  return apiFetch("/api/auth/me");
}

export function updateProfileRequest(patch) {
  return apiFetch("/api/auth/update-profile", {
    method: "POST",
    body: JSON.stringify(patch),
  });
}

export function resendOtp({ email, purpose }) {
  return apiFetch("/api/auth/resend-otp", {
    method: "POST",
    body: JSON.stringify({ email, purpose }),
  });
}

export function verifyOtp({ email, otp, purpose }) {
  return apiFetch("/api/auth/verify-otp", {
    method: "POST",
    body: JSON.stringify({ email, otp, purpose }),
  });
}

export function forgotPassword({ email }) {
  return apiFetch("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword({ ticket, newPassword }) {
  return apiFetch("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ ticket, newPassword }),
  });
}
