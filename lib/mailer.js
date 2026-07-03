import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import nodemailer from "nodemailer";
import handlebars from "handlebars";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const templatesDir = path.join(__dirname, "..", "emails");
const logoPath = path.join(__dirname, "..", "src", "assets", "passpoint-logo.jpeg");

const compiledCache = new Map();

function renderTemplate(name, data) {
  let compiled = compiledCache.get(name);
  if (!compiled) {
    const source = fs.readFileSync(path.join(templatesDir, `${name}.hbs`), "utf8");
    compiled = handlebars.compile(source);
    compiledCache.set(name, compiled);
  }
  const appName = process.env.APP_NAME || "PassPoint AI";
  return compiled({
    appName,
    supportEmail: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER || "",
    year: new Date().getFullYear(),
    ...data,
  });
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    auth: { user, pass },
  });
  return transporter;
}

// Renders `emails/<template>.hbs` with `data` and sends it via the same
// SMTP transporter pattern already used by /api/report. Falls back to a
// preview-only result (no throw) when EMAIL_USER/EMAIL_APP_PASSWORD aren't
// configured, so local dev keeps working without real SMTP credentials.
export async function sendTemplateEmail({ to, subject, template, data }) {
  const appName = process.env.APP_NAME || "PassPoint AI";
  const html = renderTemplate(template, data);

  const t = getTransporter();
  if (!t) {
    console.warn(
      `[mailer] EMAIL_USER/EMAIL_APP_PASSWORD not set — "${subject}" to ${to} was not sent (preview only).`
    );
    return { sent: false, previewHtml: html };
  }

  const from = process.env.REPORT_FROM_ADDRESS || `"${appName}" <${process.env.EMAIL_USER}>`;
  const info = await t.sendMail({
    from,
    to,
    replyTo: process.env.SUPPORT_EMAIL || process.env.EMAIL_USER,
    subject,
    html,
    attachments: fs.existsSync(logoPath)
      ? [{ filename: "passpoint-logo.jpeg", path: logoPath, cid: "pplogo" }]
      : [],
  });
  return { sent: true, messageId: info.messageId, previewHtml: html };
}
