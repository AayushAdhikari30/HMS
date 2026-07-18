import { Router } from "express";
import {
  getPendingPrescriptions,
  dispenseMedicines,
  getPharmacyTransactions,
  getPharmacyStats,
  getPharmacyReports,
  getTransaction,
} from "../controllers/pharmacyController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

// All pharmacy routes require authentication and pharmacist role
router.use(authenticate, authorise(ROLES.PHARMACIST, ROLES.ADMIN));

// Get pending prescriptions for fulfillment
router.get("/prescriptions", getPendingPrescriptions);

// Dispense medicines (create pharmacy transaction)
router.post("/dispense", dispenseMedicines);

// Get pharmacy transactions
router.get("/transactions", getPharmacyTransactions);

// Get single transaction
router.get("/transactions/:id", getTransaction);

// Get pharmacy statistics
router.get("/reports/stats", getPharmacyStats);

// Get detailed reports
router.get("/reports", getPharmacyReports);

export default router;
