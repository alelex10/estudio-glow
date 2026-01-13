import { Router } from "express";

import { getProductStats } from "../controller/dashboard";
import { authenticate, requireAdmin } from "../middleware/auth";

const dashboardRouter = Router();

dashboardRouter.get("/stats", authenticate, requireAdmin, getProductStats);

export default dashboardRouter;
