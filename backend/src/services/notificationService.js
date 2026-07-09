import { Notification } from "../models/index.js";
import { NOTIFICATION_TYPE } from "../constants.js";

// Fire-and-forget notification creator used across controllers.
// Failures are logged but never bubble up — a notification bug must not fail the parent action.
export const notify = async ({ userId, type = NOTIFICATION_TYPE.SYSTEM, title, body = null, link = null }) => {
  if (!userId || !title) return null;
  try {
    return await Notification.create({
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
};

// Broadcast the same notification to many recipients.
export const notifyMany = async (userIds, payload) => {
  if (!Array.isArray(userIds) || userIds.length === 0) return;
  await Promise.all(userIds.filter(Boolean).map((userId) => notify({ ...payload, userId })));
};
