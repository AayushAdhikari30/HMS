import { Router } from "express";
import {
  listDoctors,
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
  cancelOwnAppointment,
} from "../controllers/appointmentController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate);

// Any logged-in role can browse the doctor directory (patients use it to book)
router.get("/doctors", listDoctors);

// Patient books a new appointment
router.post("/", authorise(ROLES.PATIENT), createAppointment);

// Scoped list: patient -> own, doctor -> own, admin -> all
router.get("/", listAppointments);

// Doctor/Admin update status (confirm, complete, cancel)
router.patch("/:id/status", authorise(ROLES.DOCTOR, ROLES.ADMIN), updateAppointmentStatus);

// Patient cancels their own appointment
router.delete("/:id", authorise(ROLES.PATIENT), cancelOwnAppointment);

export default router;