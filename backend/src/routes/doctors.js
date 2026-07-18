import { Router } from "express";
import {
  setAvailability,
  listMyAvailability,
  deleteAvailability,
  addTimeOff,
  listMyTimeOff,
  deleteTimeOff,
  getDoctorSlots,
} from "../controllers/availabilityController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate);

// Doctor manages their own recurring weekly availability
router.post("/availability", authorise(ROLES.DOCTOR), setAvailability);
router.get("/availability", authorise(ROLES.DOCTOR), listMyAvailability);
router.delete("/availability/:id", authorise(ROLES.DOCTOR), deleteAvailability);

// Doctor manages one-off days off (full-day blocks)
router.post("/time-off", authorise(ROLES.DOCTOR), addTimeOff);
router.get("/time-off", authorise(ROLES.DOCTOR), listMyTimeOff);
router.delete("/time-off/:id", authorise(ROLES.DOCTOR), deleteTimeOff);

// Any authenticated user (patients booking) can check a doctor's open slots for a date
router.get("/:doctorId/slots", getDoctorSlots);

export default router;