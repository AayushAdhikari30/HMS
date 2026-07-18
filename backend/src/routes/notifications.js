import { Router } from "express";
import {
  listNotifications,
  unreadCount,
  markRead,
  markAllRead,
} from "../controllers/notificationController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

router.use(authenticate);

router.get("/", listNotifications);
router.get("/unread-count", unreadCount);
router.patch("/read-all", markAllRead);
router.patch("/:id/read", markRead);

export default router;
