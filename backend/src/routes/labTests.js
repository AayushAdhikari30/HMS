import { Router } from "express";
import {
  createLabTest,
  listLabTests,
  collectSample,
  submitResult,
} from "../controllers/labTestController.js";
import { authenticate, authorise } from "../middleware/auth.js";
import { ROLES } from "../constants.js";

const router = Router();

router.use(authenticate);

router.post("/", authorise(ROLES.DOCTOR), createLabTest);

router.get("/", listLabTests);

router.patch("/:id/collect", authorise(ROLES.LAB_ASSISTANT, ROLES.ADMIN), collectSample);

router.patch("/:id/result", authorise(ROLES.LAB_ASSISTANT, ROLES.ADMIN), submitResult);

export default router;