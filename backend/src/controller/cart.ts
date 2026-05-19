import type { Response } from "express";
import type { AuthRequest } from "../middleware/auth";
import { asyncHandler } from "../middleware/async-handler";
import { validateBody, validateParams } from "../middleware/validation";
import { successResponse } from "../utils/crud-helpers";
import { CartService } from "../services/CartService";
import {
  SyncCartSchema,
  AddCartItemSchema,
  UpdateCartItemSchema,
  CartItemProductIdParamSchema,
} from "../schemas/cart";

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

export const addCartItem = [
  validateBody(AddCartItemSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { productId, quantity } = req.body;
    const cart = await CartService.addItem(req.user.id, { productId, quantity });
    res.status(201).json(successResponse(cart, "Item added"));
  }),
];

export const updateCartItemQuantity = [
  validateParams(CartItemProductIdParamSchema),
  validateBody(UpdateCartItemSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const productId = req.params.productId;
    if (!productId) {
      throw new Error("productId required");
    }
    const { quantity } = req.body;
    const cart = await CartService.updateItemQuantity(req.user.id, productId, quantity);
    res.json(successResponse(cart, "Item updated"));
  }),
];

export const removeCartItem = [
  validateParams(CartItemProductIdParamSchema),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const productId = req.params.productId;
    if (!productId) {
      throw new Error("productId required");
    }
    const cart = await CartService.removeCartItem(req.user.id, productId);
    res.json(successResponse(cart, "Item removed"));
  }),
];
