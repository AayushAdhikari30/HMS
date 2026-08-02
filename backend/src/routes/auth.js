import { Router } from "express";
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";
import { authenticate } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";

const router = Router();



const mailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "mail" });
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 10,keyPrefix: "login",keyFn: (req) => `${req.ip}:${(req.body?.identifier || "").toLowerCase()}`,});
router.post("/register", mailLimiter, register);
router.post("/login", loginLimiter,login);
router.post("/refresh", refresh);

router.post("/forgot-password", mailLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", mailLimiter, resendVerification);

router.post("/logout", authenticate, logout);

export default router;
