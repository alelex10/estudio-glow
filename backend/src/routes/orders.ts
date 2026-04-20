import { Router } from "express";

import { getProductStats } from "../controller/dashboard";
import { getOrders, getOrderById, approveOrder, rejectOrder } from "../controller/order";
import { authenticate, requireAdmin } from "../middleware/auth";
import { validateQuery, validateParams } from "../middleware/validation";
import { PaginationOrderQuerySchema } from "../schemas/order";
import { ParamsIdSchema } from "../schemas/params";

const orderRouter = Router();

orderRouter.get("/stats", authenticate, requireAdmin, getProductStats);

orderRouter.get("/", authenticate, requireAdmin, validateQuery(PaginationOrderQuerySchema), getOrders);
orderRouter.get("/:id", authenticate, requireAdmin, validateParams(ParamsIdSchema), getOrderById);
orderRouter.post("/:id/approve", authenticate, requireAdmin, approveOrder);
orderRouter.post("/:id/reject", authenticate, requireAdmin, rejectOrder);

export default orderRouter;
