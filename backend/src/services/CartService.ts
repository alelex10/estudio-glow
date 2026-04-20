import type { UUID } from "crypto";
import { db } from "../db";
import { carts, cartItems } from "../models/cart";
import { eq, and } from "drizzle-orm";
import { DatabaseError } from "../errors";

export class CartService {
  static async getCart(userId: string) {
    let cart = await db.select().from(carts).where(eq(carts.userId, userId));

    if (!cart.length) {
      const [newCart] = await db.insert(carts).values({ userId }).returning();
      if (!newCart) throw new DatabaseError("Failed to create cart");
      cart = [newCart];
      return { ...newCart, items: [] };
    }

    if (!cart[0]) throw new DatabaseError("Failed to get cart");

    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart[0].id));
    return { ...cart[0], items };
  }

  static async syncCart(
    userId: string,
    localItems: { productId: string; quantity: number }[],
  ) {
    const cart = await this.getCart(userId);
    // Clear existing items and replace with local state (source of truth)
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    for (const item of localItems) {
      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: item.productId,
        quantity: item.quantity,
      });
    }
    return this.getCart(userId);
  }

  static async removeCartItem(userId: UUID, productId: UUID) {
    const cart = await this.getCart(userId);
    await db
      .delete(cartItems)
      .where(
        and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
      );
    return this.getCart(userId);
  }
}
