// backend/src/routes/uploads.js  (NEW FILE)
import { Router } from "express";
import path from "path";
import fs from "fs";
import { authenticate } from "../middleware/auth.js";
import { LabTest, Patient } from "../models/index.js";
import { ROLES, HTTP } from "../constants.js";

const router = Router();
const UPLOAD_ROOT = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

router.use(authenticate);

// GET /uploads/labs/:
router.get("/labs/:filename", async (req, res) => {
  try {
    const relPath = `labs/${req.params.filename}`;
    const labTest = await LabTest.findOne({ where: { image_path: relPath } });
    if (!labTest) return res.status(HTTP.NOT_FOUND).json({ message: "Not found" });

    if (req.user.role === ROLES.PATIENT) {
      const patient = await Patient.findOne({ where: { user_id: req.user.id } });
      if (!patient || labTest.patient_id !== patient.id) {
        return res.status(HTTP.NOT_FOUND).json({ message: "Not found" });
      }
    } else if (req.user.role === ROLES.DOCTOR) {
      if (labTest.ordered_by_id !== req.user.id) {
        return res.status(HTTP.NOT_FOUND).json({ message: "Not found" });
      }
    }
    // lab_assistant / admin

    const absPath = path.join(UPLOAD_ROOT, relPath);
    if (!fs.existsSync(absPath)) return res.status(HTTP.NOT_FOUND).json({ message: "File missing" });
    return res.sendFile(absPath);
  } catch (err) {
    console.error("[uploads/labs]", err);
    return res.status(HTTP.INTERNAL).json({ message: "Server error" });
  }
});

export default router;