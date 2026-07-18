import { Router } from "express";
import { createReferral, listReferrals, updateReferralStatus } from "../controllers/referralController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate);

// Doctor refers a patient to another doctor
router.post("/", authorise(ROLES.DOCTOR), createReferral);

// Scoped list: patient -> own, doctor -> sent + received, admin -> all
router.get("/", listReferrals);

// Referred doctor (or admin) accepts / completes / cancels the referral
router.patch("/:id/status", authorise(ROLES.DOCTOR, ROLES.ADMIN), updateReferralStatus);

export default router;
