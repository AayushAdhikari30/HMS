import { Notification } from "../models/index.js";
import { NOTIFICATION_TYPE } from "../constants.js";
import { getContactForUser } from "./contactService.js";
import { sendMail, renderEmail } from "./mailer.js";
import { sendSms } from "./sms.js";

// Fire-and-forget notification creator used across controllers.
// Failures are logged but never bubble up — a notification bug must not fail the parent action.

const absoluteLink = (link) => {
  if (!link) return null;
  if (/^https?:\/\//i.test(link)) return link;
  return `${process.env.CLIENT_URL || "http://localhost:5173"}${link}`;
};

// The in-app record is the source of truth; the email is a copy pushed out so a
// patient hears about an appointment without having to log in and go looking.
const emailNotification = async ({ contact, title, body, link }) => {
  const url = absoluteLink(link);

  await sendMail({
    to: contact.email,
    subject: title,
    text: [body, url && `\nView it here: ${url}`].filter(Boolean).join("\n"),
    html: renderEmail({
      heading: title,
      body: body ? `<p>${body}</p>` : "<p>You have a new update on your account.</p>",
      actionLabel: "Open in the portal",
      actionUrl: url,
    }),
  });
};

/**
 * Create an in-app notification and, unless suppressed, mirror it to the user's
 * email. Pass `sendEmail: false` for chatter that would be noise in an inbox,
 * or `sendSmsAlso: true` for something urgent enough to justify the cost.
 */
export const notify = async ({
  userId,
  type = NOTIFICATION_TYPE.SYSTEM,
  title,
  body = null,
  link = null,
  sendEmail = true,
  sendSmsAlso = false,
}) => {
  if (!userId || !title) return null;

  let record = null;
  try {
    record = await Notification.create({
      user_id: userId,
      type,
      title,
      body,
      link,
    });
  } catch (err) {
    console.error("[notify] failed", err);
    return null;
  }

  if (!sendEmail && !sendSmsAlso) return record;

  // Delivery runs only once the record is safely stored, and its failures are
  // swallowed separately: the user can still read the notification in the app.
  try {
    const contact = await getContactForUser(userId);
    if (!contact) return record;

    if (sendEmail && contact.email) {
      await emailNotification({ contact, title, body, link });
    }
    if (sendSmsAlso && contact.phone) {
      await sendSms({ to: contact.phone, body: [title, body].filter(Boolean).join(" — ") });
    }
  } catch (err) {
    console.error("[notify] delivery failed", err);
  }

  return record;
};

// Broadcast the same notification to many recipients.
export const notifyMany = async (userIds, payload) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  await Promise.all(userIds.filter(Boolean).map((userId) => notify({ ...payload, userId })));
};
