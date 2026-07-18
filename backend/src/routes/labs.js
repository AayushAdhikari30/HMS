import { Router } from "express";
import { createLabTest, listLabTests, updateLabTestStatus, cancelLabTest } from "../controllers/labController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate);

// Patient checks in for a lab test, or a doctor orders one for a patient
router.post("/", authorise(ROLES.PATIENT, ROLES.DOCTOR), createLabTest);

// Scoped list: patient -> own, doctor -> tests they ordered, lab_assistant/admin -> all
router.get("/", listLabTests);

// Lab assistant / admin move a request through the workflow (in_progress -> completed)
router.patch("/:id/status", authorise(ROLES.LAB_ASSISTANT, ROLES.ADMIN), updateLabTestStatus);

// Patient cancels their own still-pending request, or a doctor cancels one they ordered
router.delete("/:id", authorise(ROLES.PATIENT, ROLES.DOCTOR), cancelLabTest);

export default router;
