import { Router } from "express";
import { getMe } from "../controller/user";
import { getUserOrders, getUserOrderById } from "../controller/order";
import { authenticate } from "../middleware/auth";
import { validateQuery, validateParams } from "../middleware/validation";
import { PaginationOrderQuerySchema } from "../schemas/order";
import { ParamsIdSchema } from "../schemas/params";

const router = Router();

router.get("/me", authenticate, getMe);
router.get("/orders", authenticate, validateQuery(PaginationOrderQuerySchema), getUserOrders);
router.get("/orders/:id", authenticate, validateParams(ParamsIdSchema), getUserOrderById);

export default router;
