import nodemailer from "nodemailer";

// Outbound email. SMTP settings come from MAIL_* env vars; when they are absent
// (local dev, CI, a fresh clone) nothing is sent and the message is printed to
// the console instead, so every flow that mails a user stays runnable offline.

const APP_NAME = process.env.APP_NAME || "Dhulikhel Hospital";

export const isMailConfigured = () => Boolean(process.env.MAIL_HOST);

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT) || 587,
    // Port 465 is implicit TLS; 587 upgrades via STARTTLS.
    secure: process.env.MAIL_SECURE === "true" || Number(process.env.MAIL_PORT) === 465,
    auth: process.env.MAIL_USER
      ? { user: process.env.MAIL_USER, pass: process.env.MAIL_PASSWORD }
      : undefined,
  });

  return transporter;
};

const fromAddress = () => {
  const address = process.env.MAIL_FROM || "no-reply@dhulikhel-hms.local";
  return `"${process.env.MAIL_FROM_NAME || APP_NAME}" <${address}>`;
};

const logToConsole = ({ to, subject, text }) => {
  console.log("\n──────── EMAIL (not sent — MAIL_HOST unset) ────────");
  console.log(`To:      ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`\n${text}`);
  console.log("───────────────────────────────────────────────────\n");
};

/**
 * Send an email. Resolves to a result object rather than throwing — callers are
 * user-facing flows that must not fail because a mail server is down.
 */
export const sendMail = async ({ to, subject, text, html }) => {
  if (!to || !subject) return { delivered: false, reason: "missing to/subject" };

  if (!isMailConfigured()) {
    logToConsole({ to, subject, text });
    return { delivered: false, reason: "not configured" };
  }

  try {
    const info = await getTransporter().sendMail({
      from: fromAddress(),
      to,
      subject,
      text,
      html: html || undefined,
    });
    return { delivered: true, messageId: info.messageId };
  } catch (err) {
    console.error("[mailer] send failed", err);
    return { delivered: false, reason: err.message };
  }
};

/** Wraps body copy in the shared HTML shell so every email looks the same. */
export const renderEmail = ({ heading, body, actionLabel, actionUrl, footer }) => `
<div style="background:#0d0d0d;padding:32px 0;font-family:system-ui,-apple-system,Segoe UI,sans-serif;">
  <div style="max-width:520px;margin:0 auto;background:#111;border:1px solid #1f1f1f;border-radius:12px;padding:32px;">
    <h1 style="color:#fff;font-size:18px;margin:0 0 16px;">${heading}</h1>
    <div style="color:#b4b4b4;font-size:14px;line-height:1.6;">${body}</div>
    ${
      actionUrl
        ? `<p style="margin:28px 0;">
             <a href="${actionUrl}" style="background:#16a34a;color:#fff;text-decoration:none;padding:11px 22px;border-radius:8px;font-size:14px;display:inline-block;">${actionLabel}</a>
           </p>
           <p style="color:#666;font-size:12px;word-break:break-all;">Or paste this into your browser:<br>${actionUrl}</p>`
        : ""
    }
    <hr style="border:none;border-top:1px solid #1f1f1f;margin:28px 0 16px;">
    <p style="color:#555;font-size:12px;margin:0;">${footer || `${APP_NAME} — automated message, please do not reply.`}</p>
  </div>
</div>`;

export { APP_NAME };
