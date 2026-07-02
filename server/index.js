// Local dev Express server. On Vercel the API is served by the serverless
// functions in /api/*.js instead. Both share the same logic via lib/provider.js.
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import healthHandler from "../api/health.js";
import chatHandler from "../api/chat.js";
import lessonHandler from "../api/lesson.js";
import gradeHandler from "../api/grade.js";
import reportHandler from "../api/report.js";
import ttsHandler from "../api/tts.js";
import imageHandler from "../api/image.js";
import videoHandler from "../api/video.js";
import imagesHandler from "../api/images.js";
import signupHandler from "../api/auth/signup.js";
import loginHandler from "../api/auth/login.js";
import meHandler from "../api/auth/me.js";
import updateProfileHandler from "../api/auth/update-profile.js";
import resendOtpHandler from "../api/auth/resend-otp.js";
import verifyOtpHandler from "../api/auth/verify-otp.js";
import forgotPasswordHandler from "../api/auth/forgot-password.js";
import resetPasswordHandler from "../api/auth/reset-password.js";
import { connectToDatabase } from "../lib/mongodb.js";

dotenv.config();

// Connect to MongoDB on startup
connectToDatabase().catch((err) => {
  console.error("[passpoint-server] MongoDB connection error on startup:", err.message);
});

const app = express();
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "X-CSRF-Token",
      "X-Requested-With",
      "Accept",
      "Accept-Version",
      "Content-Length",
      "Content-MD5",
      "Content-Type",
      "Date",
      "X-Api-Version",
      "Authorization",
    ],
    credentials: true,
  })
);
app.use(express.json({ limit: "2mb" }));

// Tiny adapter: Express req/res are compatible enough with Vercel's signature
// that we can route directly to the same handlers. Express already parses JSON
// (above) and sets req.method/headers/body, which is all the handlers need.
app.get("/api/health", (req, res) => healthHandler(req, res));
app.post("/api/chat", (req, res) => chatHandler(req, res));
app.post("/api/lesson", (req, res) => lessonHandler(req, res));
app.post("/api/grade", (req, res) => gradeHandler(req, res));
app.post("/api/report", (req, res) => reportHandler(req, res));
app.post("/api/tts", (req, res) => ttsHandler(req, res));
app.post("/api/image", (req, res) => imageHandler(req, res));
app.post("/api/video", (req, res) => videoHandler(req, res));
app.post("/api/images", (req, res) => imagesHandler(req, res));
app.post("/api/auth/signup", (req, res) => signupHandler(req, res));
app.post("/api/auth/login", (req, res) => loginHandler(req, res));
app.get("/api/auth/me", (req, res) => meHandler(req, res));
app.post("/api/auth/update-profile", (req, res) => updateProfileHandler(req, res));
app.post("/api/auth/resend-otp", (req, res) => resendOtpHandler(req, res));
app.post("/api/auth/verify-otp", (req, res) => verifyOtpHandler(req, res));
app.post("/api/auth/forgot-password", (req, res) => forgotPasswordHandler(req, res));
app.post("/api/auth/reset-password", (req, res) => resetPasswordHandler(req, res));

const PORT = process.env.PORT || 5050;
const server = app.listen(PORT, () => {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  console.log(`[🤖 passpoint-server] running on http://localhost:${PORT}`);
  console.log(`[🚀 passpoint-server] provider=${provider}`);
});
// Without this, a port-in-use error silently exits with code 0 and the
// `concurrently` log just says "exited" with no clue why. Surface it.
server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[passpoint-server] ERROR: port ${PORT} is already in use. ` +
        `Either another process is bound to it (use \`netstat -ano | findstr :${PORT}\` ` +
        `then \`taskkill /F /PID <pid>\`), or change PORT in passpoint-demo/.env.`,
    );
  } else {
    console.error("[passpoint-server] ERROR:", err);
  }
  process.exit(1);
});
