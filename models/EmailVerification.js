import mongoose from "mongoose";

// Ephemeral OTP / password-reset state, keyed by email rather than user id
// so a signup OTP can exist before the account is created.
const EmailVerificationSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    purpose: { type: String, enum: ["signup", "reset"], required: true },
    otpHash: { type: String, required: true },
    attempts: { type: Number, default: 0 },
    verified: { type: Boolean, default: false },
    consumed: { type: Boolean, default: false },
    ticketSecretHash: { type: String, default: null },
    expiresAt: { type: Date, required: true },
    // Signup details (fullName, passwordHash, classLevel), held here until
    // the OTP is verified — the User document isn't created before that.
    payload: { type: mongoose.Schema.Types.Mixed, default: null },
  },
  { timestamps: true }
);

EmailVerificationSchema.index({ email: 1, purpose: 1, createdAt: -1 });

export default mongoose.models.EmailVerification ||
  mongoose.model("EmailVerification", EmailVerificationSchema);
