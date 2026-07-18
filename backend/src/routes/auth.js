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

// Endpoints that send mail are throttled hard: each request costs a real email
// to an address the caller never had to prove they own.
const mailLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 5, keyPrefix: "mail" });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: "login" });

router.post("/register", mailLimiter, register);
router.post("/login", loginLimiter, login);
router.post("/refresh", refresh);

router.post("/forgot-password", mailLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", mailLimiter, resendVerification);

router.post("/logout", authenticate, logout);

export default router;
