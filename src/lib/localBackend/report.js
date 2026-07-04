// Browser port of api/report.js. Real SMTP sending can't happen from the
// browser (no server to hold the mail credentials), so this always
// returns the same "preview-only" shape the original server used when no
// email provider was configured — the Homework page already renders that
// as an inline preview with a note, so the UI needs no changes.

export async function report(body) {
  const { parentEmail, studentName = "your child" } = body || {};

  if (!parentEmail || !/^\S+@\S+\.\S+$/.test(parentEmail)) {
    return { status: 400, body: { error: "Missing or invalid parentEmail" } };
  }

  const appName = import.meta.env.VITE_APP_NAME || "PassPoint AI";
  const html = buildEmailHtml(body, appName);
  const subjectLine = `${appName} · ${studentName}'s homework report`;

  return {
    status: 200,
    body: {
      sent: false,
      reason: "This demo runs without a backend, so email can't be sent automatically — here's the report preview instead.",
      previewHtml: html,
      previewSubject: subjectLine,
    },
  };
}

function buildEmailHtml(
  {
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
  },
  appName,
) {
  const gradeColor =
    percentage >= 80 ? "#059669" : percentage >= 60 ? "#2563eb" : percentage >= 40 ? "#d97706" : "#dc2626";
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
