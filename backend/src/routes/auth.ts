import { Router } from "express";
import { register, login, logout, verifyToken, setPassword, setPasswordByToken } from "../controller/auth";
import { googleRegister, googleLogin } from "../controller/google";
import { verifyEmail, resendVerification, confirmLink } from "../controller/email-verify";
import { authenticate } from "../middleware/auth";
import { authLimiter, resendVerificationLimiter } from "../middleware/rate-limit";
import { validateBody } from "../middleware/validation";
import { ResendVerificationSchema, SetPasswordSchema } from "../schemas/auth";

const router = Router();

router.post("/register", register);

router.post("/login", authLimiter, login);

// T3-04: POST /auth/google (deprecated) REMOVED — googleAuth handler deleted from controller/google.ts
router.post("/google/register", googleRegister);

router.post("/google/login", googleLogin);

router.get("/verify", authenticate, verifyToken);

router.post("/logout", logout);

// T2-08: Email verification routes (PR-2 LOCAL flow)
// GET /auth/verify-email?token=<rawToken> — consume token, set verified, redirect to FE
router.get("/verify-email", verifyEmail);

// POST /auth/resend-verification — middleware order: rate-limit → validate body → controller
// Spec §7.2: resendVerificationLimiter MUST come before validateBody (F1.12, design §7.2)
router.post(
  "/resend-verification",
  resendVerificationLimiter,
  validateBody(ResendVerificationSchema),
  resendVerification,
);

// T3-05: GET /auth/confirm-link?token=<rawToken>
// Consumes ACCOUNT_LINK token, sets google_id on user, 302-redirects to FE with outcome.
// SEC1: Referrer-Policy: no-referrer set inside handler.
router.get("/confirm-link", confirmLink);

// POST /auth/set-password — allows Google-created users to set a password for manual login
router.post("/set-password", authenticate, validateBody(SetPasswordSchema), setPassword);

// POST /auth/set-password-by-token — no auth, consumes SET_PASSWORD token from email
router.post("/set-password-by-token", authLimiter, setPasswordByToken);

export const authRouter = router;

