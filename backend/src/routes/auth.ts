import { Router } from "express";
import { register, login, logout, verifyToken } from "../controller/auth";
import { authenticate } from "../middleware/auth";

const router = Router();

router.post("/register", register);

router.post("/login", login);

router.get("/verify", authenticate, verifyToken);

router.post("/logout", logout);

export const authRouter = router;
