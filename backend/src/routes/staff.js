import { Router } from "express";
import { createStaff, listStaff } from "../controllers/staffController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate, authorise(ROLES.ADMIN));

router.post("/", createStaff);
router.get("/", listStaff);

export default router;
