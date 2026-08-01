import { Router } from "express";
import { getMyProfile, updateMyProfile, changeMyPassword } from "../controllers/profileController.js";
import { authenticate } from "../middleware/auth.js";

const router = Router();

// Any authenticated user manages their own profile — no role restriction,
// since every role (patient, doctor, pharmacist, lab assistant, admin) needs
// this the same way.
router.use(authenticate);

router.get("/", getMyProfile);
router.patch("/", updateMyProfile);
router.patch("/password", changeMyPassword);

export default router;
