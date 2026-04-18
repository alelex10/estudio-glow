import { Router } from "express";
import { register, login, logout, verifyToken } from "../controller/auth";
import { googleAuth, googleRegister, googleLogin } from "../controller/google";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.post("/google", googleAuth);

router.post("/google/register", googleRegister);

router.post("/google/login", googleLogin);

router.get("/verify", authenticate, verifyToken);

router.post("/logout", logout);

export const authRouter = router;

