import nodemailer from "nodemailer";

// POST /api/report
//
// Sends a homework-marking report to the parent's email.
//
// Provider resolution chain (first one configured wins):
//   1. SMTP via nodemailer — EMAIL_SERVICE + EMAIL_USER + EMAIL_APP_PASSWORD
//      (e.g. Gmail with an App Password). This is the recommended setup
//      because Gmail apps passwords are free + instant + reliable.
//   2. Resend — RESEND_API_KEY (free tier: 100 emails/day).
//   3. Preview-only fallback — returns { sent: false, previewHtml } so
//      the UI can still show the rendered email body during a demo.
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const body = req.body || {};
    const { parentEmail, studentName = "your child" } = body;

    if (!parentEmail || !/^\S+@\S+\.\S+$/.test(parentEmail)) {
      return res.status(400).json({ error: "Missing or invalid parentEmail" });
    }

    const appName = process.env.APP_NAME || "PassPoint AI";
    const html = buildEmailHtml(body);
    const subjectLine = `${appName} · ${studentName}'s homework report`;

    // ── 1. SMTP via nodemailer (preferred) ──────────────────────────
    const smtpUser = process.env.EMAIL_USER;
    const smtpPass = process.env.EMAIL_APP_PASSWORD;
    if (smtpUser && smtpPass) {
      const service = process.env.EMAIL_SERVICE || "gmail";
      const transporter = nodemailer.createTransport({
        service,
        auth: { user: smtpUser, pass: smtpPass },
      });

      const fromAddress =
        process.env.REPORT_FROM_ADDRESS || `"${appName}" <${smtpUser}>`;

      try {
        const info = await transporter.sendMail({
          from: fromAddress,
          to: parentEmail,
          replyTo: process.env.SUPPORT_EMAIL || smtpUser,
          subject: subjectLine,
          html,
        });
        return res.status(200).json({
          sent: true,
          via: "smtp",
          messageId: info.messageId,
          previewHtml: html,
        });
      } catch (err) {
        console.error("[report] SMTP error:", err);
        return res.status(500).json({
          sent: false,
          error: `SMTP send failed: ${String(err?.message || err)}`,
          previewHtml: html,
        });
      }
    }

    // ── 2. Resend fallback ──────────────────────────────────────────
    const resendKey = process.env.RESEND_API_KEY;
    if (resendKey) {
      const fromAddress =
        process.env.REPORT_FROM_ADDRESS || `${appName} <onboarding@resend.dev>`;
      const r = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: fromAddress,
          to: [parentEmail],
          subject: subjectLine,
          html,
        }),
      });
      if (!r.ok) {
        const errText = await r.text();
        console.error("[report] resend error:", errText);
        return res.status(r.status).json({ error: errText, previewHtml: html });
      }
      const data = await r.json();
      return res
        .status(200)
        .json({ sent: true, via: "resend", id: data?.id, previewHtml: html });
    }

    // ── 3. Preview-only fallback ────────────────────────────────────
    return res.status(200).json({
      sent: false,
      reason:
        "No email provider configured. Set EMAIL_USER + EMAIL_APP_PASSWORD (Gmail App Password) or RESEND_API_KEY in .env to enable real delivery.",
      previewHtml: html,
      previewSubject: subjectLine,
    });
  } catch (err) {
    console.error("[report] handler error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}

function buildEmailHtml({
  studentName = "your child",
  subject = "Mathematics",
  topic = "",
  classLevel = "",
  score = 0,
  total = 0,
  percentage = 0,
  grade = "",
  overallFeedback = "",
  suggestions = [],
  questions = [],
}) {
  const appName = process.env.APP_NAME || "PassPoint AI";
  const gradeColor =
    percentage >= 80
      ? "#059669"
      : percentage >= 60
        ? "#2563eb"
        : percentage >= 40
          ? "#d97706"
          : "#dc2626";
  const qRows = questions
    .map(
      (q) => `
        <tr style="border-top:1px solid #e5e7eb;">
          <td style="padding:8px 6px;font-weight:600;color:#0f172a;">Q${q.number}</td>
          <td style="padding:8px 6px;color:#334155;">${esc(q.question || "")}</td>
          <td style="padding:8px 6px;color:${q.isCorrect ? "#059669" : "#dc2626"};font-weight:600;">${q.isCorrect ? "✓" : "✗"} ${q.marksAwarded}/${q.marksAvailable}</td>
        </tr>
        <tr><td colspan="3" style="padding:0 6px 8px 6px;color:#64748b;font-size:13px;">${esc(q.feedback || "")}</td></tr>`,
    )
    .join("");

  const suggestionItems = (suggestions || [])
    .map((s) => `<li style="margin:4px 0;color:#334155;">${esc(s)}</li>`)
    .join("");

  return `<!doctype html>
<html><body style="margin:0;background:#f8fafc;font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0f172a;">
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 6px 24px rgba(15,23,42,0.08);">
    <div style="background:linear-gradient(135deg,#1E3A8A,#3B5BDB);color:#fff;padding:24px;">
      <div style="font-size:11px;letter-spacing:2px;opacity:0.85;text-transform:uppercase;font-weight:700;">${esc(appName)} · Homework Report</div>
      <div style="font-size:22px;font-weight:800;margin-top:6px;">${esc(studentName)}</div>
      <div style="opacity:0.85;font-size:13px;margin-top:2px;">${esc(classLevel)} · ${esc(subject)}${topic ? " · " + esc(topic) : ""}</div>
    </div>

    <div style="padding:24px;">
      <div style="display:flex;gap:16px;align-items:center;margin-bottom:16px;">
        <div style="flex:1;background:#f1f5f9;border-radius:12px;padding:14px;">
          <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Score</div>
          <div style="font-size:32px;font-weight:800;color:${gradeColor};">${score} / ${total}</div>
          <div style="font-size:12px;color:#64748b;">${percentage}% · ${esc(grade)}</div>
        </div>
      </div>

      <h3 style="font-size:15px;color:#0f172a;margin:16px 0 8px;">Teacher's note</h3>
      <p style="margin:0;color:#334155;line-height:1.6;">${esc(overallFeedback)}</p>

      ${
        questions.length
          ? `<h3 style="font-size:15px;color:#0f172a;margin:24px 0 8px;">Question-by-question</h3>
             <table style="width:100%;border-collapse:collapse;font-size:14px;">${qRows}</table>`
          : ""
      }

      ${
        suggestions.length
          ? `<h3 style="font-size:15px;color:#0f172a;margin:24px 0 8px;">What to practise next</h3>
             <ul style="margin:0;padding-left:20px;">${suggestionItems}</ul>`
          : ""
      }
    </div>

    <div style="background:#f8fafc;padding:14px 24px;text-align:center;color:#64748b;font-size:12px;border-top:1px solid #e5e7eb;">
      Sent automatically by ${esc(appName)} — your child's learning companion.
    </div>
  </div>
</body></html>`;
}

function esc(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
