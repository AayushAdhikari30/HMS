import { Notification } from "../models/index.js";
import { HTTP } from "../constants.js";

const serializeNotification = (n) => ({
  id: n.id,
  type: n.type,
  title: n.title,
  body: n.body,
  link: n.link,
  isRead: n.is_read,
  readAt: n.read_at,
  createdAt: n.createdAt,
});

// GET /notifications — list current user's notifications
export const listNotifications = async (req, res) => {
  try {
    const { unread } = req.query;
    const where = { user_id: req.user.id };
    if (unread === "true") where.is_read = false;

    const notifications = await Notification.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 50,
    });

    const unreadCount = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });

    return res.status(HTTP.OK).json({
      success: true,
      notifications: notifications.map(serializeNotification),
      unreadCount,
    });
  } catch (err) {
    console.error("[notifications/list]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// GET /notifications/unread-count — cheap poll for the bell badge
export const unreadCount = async (req, res) => {
  try {
    const count = await Notification.count({
      where: { user_id: req.user.id, is_read: false },
    });
    return res.status(HTTP.OK).json({ success: true, unreadCount: count });
  } catch (err) {
    console.error("[notifications/unread-count]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /notifications/:id/read — mark one as read
export const markRead = async (req, res) => {
  try {
    const notification = await Notification.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });
    if (!notification) return res.status(HTTP.NOT_FOUND).json({ message: "Notification not found" });

    if (!notification.is_read) {
      await notification.update({ is_read: true, read_at: new Date() });
    }
    return res.status(HTTP.OK).json({ success: true, notification: serializeNotification(notification) });
  } catch (err) {
    console.error("[notifications/markRead]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};

// PATCH /notifications/read-all — mark all as read
export const markAllRead = async (req, res) => {
  try {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { user_id: req.user.id, is_read: false } },
    );
    return res.status(HTTP.OK).json({ success: true, message: "All notifications marked read" });
  } catch (err) {
    console.error("[notifications/markAllRead]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
};
