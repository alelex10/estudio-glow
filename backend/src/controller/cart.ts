import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/async-handler";
import { validateBody, validateParams } from "../middleware/validation";
import { successResponse } from "../utils/crud-helpers";
import { CartService } from "../services/CartService";
import { SyncCartSchema } from "../schemas/cart";
import { ParamsIdSchema } from "../schemas/params";

export const getCart = [
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const cart = await CartService.getCart(req.user.id);
    res.json(successResponse(cart, "Success"));
  }),
];

export const syncCart = [
  validateBody(SyncCartSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { items } = req.body;
    const cart = await CartService.syncCart(req.user.id, items);
    res.json(successResponse(cart, "Cart synced"));
  }),
];

export const removeCartItem = [
  validateParams(ParamsIdSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const productId = req.params.id;
    const cart = await CartService.removeCartItem(req.user.id, productId);
    res.json(successResponse(cart, "Item removed"));
  }),
];
