import type { Request, Response } from "express";
import { db } from "../db";
import { orders } from "../models/order";
import { eq, desc, and, count, asc } from "drizzle-orm";
import { OrderService } from "../services/OrderService";
import { validateQuery, validateParams } from "../middleware/validation";
import { PaginationOrderQuerySchema } from "../schemas/order";
import { ParamsIdSchema } from "../schemas/params";
import {
  calculatePaginationMetadata,
  calculateOffset,
  type PaginatedResponse,
  checkOrderExists,
  successResponse
} from "../utils/crud-helpers";
import { asyncHandler } from "../middleware/async-handler";

type FilterCondition = ReturnType<typeof eq> | ReturnType<typeof and>;

async function buildOrderFilters(
  status?: string,
  paymentMethod?: string
): Promise<FilterCondition[]> {
  const conditions: FilterCondition[] = [];

  if (status) {
    conditions.push(eq(orders.status, status as "PENDING" | "PAID" | "PENDING_VERIFICATION" | "CANCELLED" | "EXPIRED"));
  }

  if (paymentMethod) {
    conditions.push(eq(orders.paymentMethod, paymentMethod as "MERCADO_PAGO" | "TRANSFER"));
  }

  return conditions;
}

async function countOrders(conditions: FilterCondition[]): Promise<number> {
  const totalResult =
    conditions.length > 0
      ? await db.select({ total: count() }).from(orders).where(and(...conditions))
      : await db.select({ total: count() }).from(orders);

  return totalResult[0]?.total || 0;
}

async function executePaginatedOrderQuery(
  conditions: FilterCondition[],
  sortBy: "createdAt" | "totalAmount",
  sortOrder: "asc" | "desc",
  limit: number,
  offset: number
) {
  let query = db.select().from(orders);

  if (conditions.length > 0) {
    query = query.where(and(...conditions)) as typeof query;
  }

  const orderFn = sortOrder === "desc" ? desc : asc;

  return await query.orderBy(orderFn(orders[sortBy])).limit(limit).offset(offset);
}

export const getOrders = async (req: Request, res: Response) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

export const getOrderById = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const order = await OrderService.getOrderById(id);
    res.json(order);
  }),
];

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user orders" });
  }
};

export const getUserOrderById = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params as { id: string };
    const userId = (req as any).user.id;
    
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
