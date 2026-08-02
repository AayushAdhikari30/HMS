// backend/src/routes/rooms.js  (NEW)
import { Router } from "express";
import { listRooms, createRoom, updateRoomStatus, deleteRoom } from "../controllers/roomController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();
router.use(authenticate, authorise(ROLES.ADMIN));

router.get("/", listRooms);
router.post("/", createRoom);
router.patch("/:id/status", updateRoomStatus);
router.delete("/:id", deleteRoom);

export default router;