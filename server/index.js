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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));

// Tiny adapter: Express req/res are compatible enough with Vercel's signature
// that we can route directly to the same handlers. Express already parses JSON
// (above) and sets req.method/headers/body, which is all the handlers need.
app.get("/api/health", (req, res) => healthHandler(req, res));
app.post("/api/chat", (req, res) => chatHandler(req, res));
app.post("/api/lesson", (req, res) => lessonHandler(req, res));
app.post("/api/grade", (req, res) => gradeHandler(req, res));
app.post("/api/report", (req, res) => reportHandler(req, res));

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  const provider = (process.env.AI_PROVIDER || "openai").toLowerCase();
  console.log(`[passpoint-server] running on http://localhost:${PORT}`);
  console.log(`[passpoint-server] provider=${provider}`);
});
