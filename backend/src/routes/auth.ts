import { Router } from "express";
import { register, login, logout } from "../controller/auth";

const router = Router();

// Register
router.post("/register", register);

// Login
router.post("/login", login);

// Logout
router.post("/logout", logout);

export const authRouter = router;
