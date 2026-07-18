import { Router } from "express";
import { createPrescription, listPrescriptions } from "../controllers/prescriptionController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate);

// Doctor writes a new prescription
router.post("/", authorise(ROLES.DOCTOR), createPrescription);

// Scoped list: patient -> own, doctor -> own-written, admin -> all
router.get("/", listPrescriptions);

export default router;