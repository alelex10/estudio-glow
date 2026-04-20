import { Router } from "express";
import { getProductStats } from "../controller/dashboard";
import { authenticate } from "../middleware/auth";

const router = Router();

router.get("/stats", authenticate, getProductStats);

export default router;
