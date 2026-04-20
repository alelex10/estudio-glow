import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import { validateBody, validateParams } from "../middleware/validation";
import { successResponse } from "../utils/crud-helpers";
import { CartService } from "../services/CartService";
import { SyncCartSchema } from "../schemas/cart";
import { ParamsIdSchema } from "../schemas/params";

export const getCart = [
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const cart = await CartService.getCart(userId);
    res.json(successResponse(cart, "Success"));
  }),
];

export const syncCart = [
  validateBody(SyncCartSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const { items } = req.body;
    const cart = await CartService.syncCart(userId, items);
    res.json(successResponse(cart, "Cart synced"));
  }),
];

export const removeCartItem = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.id;
    const productId = (req.params as any).id;
    if (!productId) throw new Error("productId es requerido");
    const cart = await CartService.removeCartItem(userId, productId);
    res.json(successResponse(cart, "Item removed"));
  }),
];
