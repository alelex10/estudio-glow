import { db } from "../db";
import { carts, cartItems } from "../models/cart";
import { eq, and } from "drizzle-orm";

export class CartService {
  static async getCart(userId: string) {
    const existing = await db.select().from(carts).where(eq(carts.userId, userId));
    let cart = existing[0];

    if (!cart) {
      const [inserted] = await db
        .insert(carts)
        .values({ userId })
        .onConflictDoNothing({ target: carts.userId })
        .returning();

      // Otro request concurrente ganó la race → leer el carrito existente
      cart = inserted ?? (await db.select().from(carts).where(eq(carts.userId, userId)))[0];
    }

    if (!cart) throw new Error("Failed to get or create cart for user");

    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));
    return { ...cart, items };
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

  static async removeCartItem(userId: string, productId: string) {
    const cart = await this.getCart(userId);
    await db
      .delete(cartItems)
      .where(
        and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
      );

    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));
    return { ...cart, items };
  }
}
