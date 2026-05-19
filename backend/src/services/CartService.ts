import { db } from "../db";
import { carts, cartItems } from "../models/cart";
import { products } from "../models/product";
import { eq, and, inArray } from "drizzle-orm";
import { NotFoundError } from "../errors";

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

    // Fetch stock for all products in the cart to validate quantities
    const productIds = localItems.map((i) => i.productId);
    const stocks = await db
      .select({ id: products.id, stock: products.stock })
      .from(products)
      .where(inArray(products.id, productIds));

    const stockMap = new Map(stocks.map((s) => [s.id, s.stock]));

    // Clear existing items and replace with validated local state
    await db.delete(cartItems).where(eq(cartItems.cartId, cart.id));

    for (const item of localItems) {
      const maxStock = stockMap.get(item.productId);
      const validQuantity =
        maxStock !== undefined && item.quantity > maxStock
          ? maxStock
          : item.quantity;

      await db.insert(cartItems).values({
        cartId: cart.id,
        productId: item.productId,
        quantity: validQuantity,
      });
    }
    return this.getCart(userId);
  }

  static async addItem(
    userId: string,
    { productId, quantity }: { productId: string; quantity: number },
  ) {
    const cart = await this.getCart(userId);

    return db.transaction(async (tx) => {
      const product = await tx
        .select({ id: products.id, stock: products.stock })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product[0]) {
        throw new NotFoundError("Producto no encontrado");
      }

      const maxStock = product[0].stock;
      const validQuantity = quantity > maxStock ? maxStock : quantity;

      if (validQuantity <= 0) {
        await tx
          .delete(cartItems)
          .where(
            and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
          );
      } else {
        // Idempotent upsert keyed by (cart_id, product_id) unique constraint.
        // Prevents the SELECT-then-INSERT race when many requests land at once.
        await tx
          .insert(cartItems)
          .values({
            cartId: cart.id,
            productId,
            quantity: validQuantity,
          })
          .onConflictDoUpdate({
            target: [cartItems.cartId, cartItems.productId],
            set: { quantity: validQuantity, updatedAt: new Date() },
          });
      }

      const items = await tx
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart.id));
      return { ...cart, items };
    });
  }

  static async updateItemQuantity(
    userId: string,
    productId: string,
    quantity: number,
  ) {
    const cart = await this.getCart(userId);

    return db.transaction(async (tx) => {
      const product = await tx
        .select({ id: products.id, stock: products.stock })
        .from(products)
        .where(eq(products.id, productId))
        .limit(1);

      if (!product[0]) {
        throw new NotFoundError("Producto no encontrado");
      }

      if (quantity <= 0) {
        await tx
          .delete(cartItems)
          .where(
            and(eq(cartItems.cartId, cart.id), eq(cartItems.productId, productId)),
          );
      } else {
        const maxStock = product[0].stock;
        const validQuantity = quantity > maxStock ? maxStock : quantity;

        await tx
          .insert(cartItems)
          .values({
            cartId: cart.id,
            productId,
            quantity: validQuantity,
          })
          .onConflictDoUpdate({
            target: [cartItems.cartId, cartItems.productId],
            set: { quantity: validQuantity, updatedAt: new Date() },
          });
      }

      const items = await tx
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart.id));
      return { ...cart, items };
    });
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
