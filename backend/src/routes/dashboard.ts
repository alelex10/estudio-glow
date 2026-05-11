import { Router } from "express";
import { getProductStats } from "../controller/dashboard";
import { authenticate, requireAdmin } from "../middleware/auth";

const router = Router();

router.get("/stats", authenticate, requireAdmin, getProductStats);

export default router;
