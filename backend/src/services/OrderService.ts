import { db } from "../db";
import { orders, orderItems, type OrderWithItems } from "../models/order";
import { carts, cartItems } from "../models/cart";
import { products } from "../models/product";
import { count, eq, desc, asc, inArray } from "drizzle-orm";
import { DatabaseError } from "../errors";

export class OrderService {
  static async createOrder(
    userId: string,
    paymentMethod: "MERCADO_PAGO" | "TRANSFER",
    receiptUrl?: string,
  ) {
    return await db.transaction(async (tx) => {
      const cart = await tx
        .select()
        .from(carts)
        .where(eq(carts.userId, userId));

      if (!cart[0]) throw new DatabaseError("Cart not found");

      const items = await tx
        .select()
        .from(cartItems)
        .where(eq(cartItems.cartId, cart[0].id));

      let totalAmount = 0;

      for (const item of items) {
        const product = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product[0])
          throw new Error(`Product not found for item ${item.productId}`);

        if (product[0].stock < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${product[0]?.name || item.productId}`,
          );
        }

        await tx
          .update(products)
          .set({ stock: product[0].stock - item.quantity })
          .where(eq(products.id, item.productId));
        totalAmount += product[0].price * item.quantity;
      }

      const expiresAt = new Date();
      if (paymentMethod === "MERCADO_PAGO") {
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      } else {
        expiresAt.setHours(expiresAt.getHours() + 48);
      }

      const initialStatus =
        paymentMethod === "TRANSFER" ? "PENDING_VERIFICATION" : "PENDING";

      const [newOrder] = await tx
        .insert(orders)
        .values({
          userId,
          status: initialStatus,
          paymentMethod,
          totalAmount,
          receiptUrl,
          expiresAt,
        })
        .returning();

      if (!newOrder) {
        throw new Error("Failed to create order");
      }

      for (const item of items) {
        const product = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));

        if (!product[0]) {
          throw new Error(`Product not found for item ${item.productId}`);
        }

        await tx.insert(orderItems).values({
          orderId: newOrder.id,
          productId: item.productId,
          quantity: item.quantity,
          priceAtPurchase: product[0].price,
        });
      }

      await tx.delete(cartItems).where(eq(cartItems.cartId, cart[0].id));
      return newOrder;
    });
  }

  static async markOrderPaid(orderId: string) {
    await db
      .update(orders)
      .set({ status: "PAID", expiresAt: null })
      .where(eq(orders.id, orderId));
  }

  static async cancelOrder(orderId: string) {
    return await db.transaction(async (tx) => {
      const order = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order[0]) throw new Error("Order not found");

      if (
        order[0].status === "CANCELLED" ||
        order[0].status === "EXPIRED" ||
        order[0].status === "PAID"
      ) {
        return;
      }

      const items = await tx
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
      for (const item of items) {
        const product = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId));
        if (product[0]) {
          await tx
            .update(products)
            .set({ stock: product[0].stock + item.quantity })
            .where(eq(products.id, item.productId));
        }
      }

      await tx
        .update(orders)
        .set({ status: "CANCELLED" })
        .where(eq(orders.id, orderId));
    });
  }

  static async getOrderById(orderId: string): Promise<OrderWithItems> {
    const order = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (!order[0]) {
      throw new Error("Order not found");
    }

    const items = await db
      .select({
        id: orderItems.id,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        priceAtPurchase: orderItems.priceAtPurchase,
        product: {
          id: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
        },
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return {
      ...order[0],
      items,
    };
  }

  static async getUserOrders(
    userId: string,
    page: number,
    limit: number,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc"
  ) {
    const offset = (page - 1) * limit;
    const orderFn = sortOrder === "desc" ? desc : asc;

    const sortByColumn = sortBy === "createdAt" ? orders.createdAt : orders.totalAmount;

    const data = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(orderFn(sortByColumn))
      .limit(limit)
      .offset(offset);

    const [totalResult] = await db
      .select({ total: count() })
      .from(orders)
      .where(eq(orders.userId, userId));

    const total = totalResult?.total ?? 0;

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  static async getOrders(
    page: number,
    limit: number,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    status?: string,
    paymentMethod?: string,
    includeItems: boolean = false
  ) {
    const offset = (page - 1) * limit;
    const orderFn = sortOrder === "desc" ? desc : asc;
    const sortByColumn = sortBy === "createdAt" ? orders.createdAt : orders.totalAmount;

    let query = db.select().from(orders);

    if (status) {
      query = query.where(eq(orders.status, status as any)) as typeof query;
    }

    if (paymentMethod) {
      query = query.where(eq(orders.paymentMethod, paymentMethod as any)) as typeof query;
    }

    let data;

    data = await query
      .orderBy(orderFn(sortByColumn))
      .limit(limit)
      .offset(offset);

    if (includeItems && data.length > 0) {
      const orderIds = data.map((o) => o.id);

      // Single batch query for ALL items of ALL orders
      const allItems = await db
        .select({
          id: orderItems.id,
          orderId: orderItems.orderId,
          productId: orderItems.productId,
          quantity: orderItems.quantity,
          priceAtPurchase: orderItems.priceAtPurchase,
          product: {
            id: products.id,
            name: products.name,
            imageUrl: products.imageUrl,
          },
        })
        .from(orderItems)
        .innerJoin(products, eq(orderItems.productId, products.id))
        .where(inArray(orderItems.orderId, orderIds));

      // Group items by orderId in JS (O(n) instead of N queries)
      const itemsByOrderId = new Map<string, typeof allItems>();
      for (const item of allItems) {
        const group = itemsByOrderId.get(item.orderId);
        if (group) {
          group.push(item);
        } else {
          itemsByOrderId.set(item.orderId, [item]);
        }
      }

      data = data.map((order) => ({
        ...order,
        items: itemsByOrderId.get(order.id) ?? [],
      }));
    }

    // Total count (respects the same filters as the data query)
    let totalQuery = db.select({ total: count() }).from(orders);
    if (status) {
      totalQuery = totalQuery.where(eq(orders.status, status as any)) as typeof totalQuery;
    }
    if (paymentMethod) {
      totalQuery = totalQuery.where(eq(orders.paymentMethod, paymentMethod as any)) as typeof totalQuery;
    }
    const [totalResult] = await totalQuery;
    const total = totalResult?.total ?? 0;

    return {
      data,
      pagination: {
        page,
        limit,
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPreviousPage: page > 1,
      },
    };
  }
}
