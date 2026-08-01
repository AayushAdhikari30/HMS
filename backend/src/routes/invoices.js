import { Router } from "express";
import {
  createInvoice,
  listInvoices,
  getInvoice,
  recordPayment,
  cancelInvoice,
  invoiceStats,
} from "../controllers/invoiceController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate);

// Admin summary — total billed / collected / outstanding
router.get("/stats", authorise(ROLES.ADMIN), invoiceStats);

// Admin creates an invoice
router.post("/", authorise(ROLES.ADMIN), createInvoice);

// Patient -> own, admin -> all
router.get("/", listInvoices);
router.get("/:id", getInvoice);

// Patient pays their own, admin can record on behalf
router.post("/:id/payments", authorise(ROLES.PATIENT, ROLES.ADMIN), recordPayment);

// Admin voids
router.patch("/:id/cancel", authorise(ROLES.ADMIN), cancelInvoice);

export default router;
