import type { Request, Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { OrderService } from "../services/OrderService";
import { validateParams } from "../middleware/validation";
import { PaginationOrderQuerySchema } from "../schemas/order";
import { ParamsIdSchema } from "../schemas/params";
import {
  checkOrderExists,
  successResponse
} from "../utils/crud-helpers";
import { asyncHandler } from "../middleware/async-handler";

export const getOrders = asyncHandler(async (req: Request, res: Response) => {
  const validatedQuery = PaginationOrderQuerySchema.parse(req.query);
  const { page, limit, sortBy, sortOrder, status, paymentMethod, includeItems } = validatedQuery;

  const result = await OrderService.getOrders(
    page,
    limit,
    sortBy,
    sortOrder,
    status,
    paymentMethod,
    includeItems
  );

  res.json(result);
});

export const getOrderById = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const order = await OrderService.getOrderById(id);
    res.json(order);
  }),
];

export const getUserOrders = asyncHandler(async (req: AuthRequest, res: Response) => {
  const userId = req.user.id;
  const validatedQuery = PaginationOrderQuerySchema.parse(req.query);
  const { page, limit, sortBy, sortOrder } = validatedQuery;

  const result = await OrderService.getUserOrders(
    userId,
    page,
    limit,
    sortBy,
    sortOrder
  );

  res.json(result);
});

export const getUserOrderById = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params as { id: string };
    const userId = req.user.id;
    
    const order = await checkOrderExists(id);
    
    if (order.userId !== userId) {
      return res.status(403).json({ error: "You can only view your own orders" });
    }
    
    const orderWithItems = await OrderService.getOrderById(id);
    res.json(orderWithItems);
  }),
];

export const approveOrder = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const order = await checkOrderExists(id);

    if (order.status === "PENDING_VERIFICATION" || order.status === "PENDING") {
      await OrderService.markOrderPaid(id);
      res.json(successResponse({ message: "Order approved" }, "Order approved"));
    } else {
      res.status(400).json({ error: "Order cannot be approved from current status" });
    }
  }),
];

export const rejectOrder = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    await checkOrderExists(id);
    await OrderService.cancelOrder(id);
    res.json(successResponse({ message: "Order rejected and stock returned" }, "Order rejected"));
  }),
];
