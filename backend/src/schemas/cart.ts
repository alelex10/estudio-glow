import { z } from "zod";
import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

export const CartItemSchema = z
  .object({
    productId: z.string().uuid().openapi({
      example: "550e8400-e29b-41d4-a716-446655440000",
      description: "ID del producto",
    }),
    quantity: z.number().int().positive().openapi({
      example: 1,
      description: "Cantidad del producto",
    }),
  })
  .openapi("CartItem");

export const SyncCartSchema = z
  .object({
    items: z.array(CartItemSchema).openapi({
      description: "Array de items del carrito",
    }),
  })
  .openapi("SyncCart");

export type CartItem = z.infer<typeof CartItemSchema>;
export type SyncCart = z.infer<typeof SyncCartSchema>;
