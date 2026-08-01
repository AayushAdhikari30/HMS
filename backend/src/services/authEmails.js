import { sendMail, renderEmail, APP_NAME } from "./mailer.js";

const clientUrl = () => process.env.CLIENT_URL || "http://localhost:5173";

export const sendVerificationEmail = async ({ to, name, token }) => {
  const url = `${clientUrl()}/verify-email?token=${token}`;

  return sendMail({
    to,
    subject: `Verify your ${APP_NAME} account`,
    text: `Hi ${name},\n\nConfirm your email address to activate your ${APP_NAME} account:\n${url}\n\nThis link expires in 24 hours. If you did not sign up, ignore this email.`,
    html: renderEmail({
      heading: "Confirm your email address",
      body: `<p>Hi ${name},</p><p>Confirm your email address to activate your ${APP_NAME} account. This link expires in 24 hours.</p>`,
      actionLabel: "Verify email",
      actionUrl: url,
      footer: "If you did not sign up, you can safely ignore this email.",
    }),
  });
};

export const sendPasswordResetEmail = async ({ to, name, token }) => {
  const url = `${clientUrl()}/reset-password?token=${token}`;

  return sendMail({
    to,
    subject: `Reset your ${APP_NAME} password`,
    text: `Hi ${name},\n\nReset your password here:\n${url}\n\nThis link expires in 1 hour and can only be used once. If you did not request this, ignore this email — your password has not changed.`,
    html: renderEmail({
      heading: "Reset your password",
      body: `<p>Hi ${name},</p><p>Use the button below to choose a new password. This link expires in <strong>1 hour</strong> and can only be used once.</p>`,
      actionLabel: "Reset password",
      actionUrl: url,
      footer: "If you did not request this, ignore this email — your password has not changed.",
    }),
  });
};

/**
 * New staff get their staff ID plus a link to choose their own password. We
 * deliberately do not email the generated temp password — the admin already has
 * it on screen if they'd rather read it out.
 */
export const sendStaffWelcomeEmail = async ({ to, name, identifier, role, token }) => {
  const url = `${clientUrl()}/reset-password?token=${token}`;

  return sendMail({
    to,
    subject: `Your ${APP_NAME} staff account`,
    text: `Hi ${name},\n\nA ${role} account has been created for you at ${APP_NAME}.\n\nYour staff ID is ${identifier} — you sign in with this, not your email address.\n\nChoose your password here (link expires in 1 hour):\n${url}`,
    html: renderEmail({
      heading: `Welcome to ${APP_NAME}`,
      body: `<p>Hi ${name},</p><p>A <strong>${role}</strong> account has been created for you.</p><p>Your staff ID is <strong style="color:#fff;">${identifier}</strong> — you sign in with this, not your email address.</p><p>Choose your password using the button below. The link expires in 1 hour; if it lapses, use "Forgot password" on the sign-in page.</p>`,
      actionLabel: "Set your password",
      actionUrl: url,
    }),
  });
};

/** Sent after a successful reset so account takeover is at least noticed. */
export const sendPasswordChangedEmail = async ({ to, name }) =>
  sendMail({
    to,
    subject: `Your ${APP_NAME} password was changed`,
    text: `Hi ${name},\n\nYour password was just changed and you have been signed out on all devices. If this wasn't you, contact the hospital administrator immediately.`,
    html: renderEmail({
      heading: "Your password was changed",
      body: `<p>Hi ${name},</p><p>Your password was just changed, and you have been signed out on all devices.</p><p>If this wasn't you, contact the hospital administrator immediately.</p>`,
    }),
  });
