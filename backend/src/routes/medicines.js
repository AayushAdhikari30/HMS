import { Router } from "express";
import {
  listMedicines,
  listSections,
  getMedicine,
  adjustStock,
} from "../controllers/medicineController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate, authorise(ROLES.PHARMACIST, ROLES.ADMIN, ROLES.DOCTOR));

// Sections list is used to render the "find where" grouping in the UI
router.get("/sections", listSections);

router.get("/", listMedicines);
router.get("/:id", getMedicine);

// Stock changes are pharmacist/admin only
router.patch("/:id/stock", authorise(ROLES.PHARMACIST, ROLES.ADMIN), adjustStock);

export default router;
