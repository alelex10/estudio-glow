import { db } from "../db";
import { orders } from "../models/order";
import { products } from "../models/product";
import { and, eq, gte, sql } from "drizzle-orm";
import type { OrderWithItems } from "../models/order";
import { BadRequestError, ConflictError, NotFoundError, DatabaseError } from "../errors";
import { OrderRepository } from "../repositories/OrderRepository";
import { logger } from "../lib/logger";

export class OrderService {
  static async createOrder(
    userId: string,
    paymentMethod: "MERCADO_PAGO" | "TRANSFER",
    items: { productId: string; quantity: number }[],
    receiptUrl?: string,
  ) {
    return await db.transaction(async (tx) => {
      if (!items || items.length === 0) {
        throw new BadRequestError("El carrito está vacío");
      }

      let totalAmount = 0;
      const priceByProductId = new Map<string, number>();

      // Atomic stock decrement with guard — prevents oversell under concurrency
      for (const item of items) {
        const updated = await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(
            and(
              eq(products.id, item.productId),
              gte(products.stock, item.quantity),
            ),
          )
          .returning({
            id: products.id,
            name: products.name,
            price: products.price,
            stock: products.stock,
          });

        if (!updated[0]) {
          const existing = await tx
            .select({ name: products.name, stock: products.stock })
            .from(products)
            .where(eq(products.id, item.productId));

          if (!existing[0]) {
            throw new NotFoundError(`Producto no encontrado: ${item.productId}`);
          }

          throw new ConflictError(
            `Stock insuficiente para "${existing[0].name || item.productId}". Disponible: ${existing[0].stock}, solicitado: ${item.quantity}`,
          );
        }

        priceByProductId.set(item.productId, updated[0].price);
        totalAmount += updated[0].price * item.quantity;
      }

      const expiresAt = new Date();
      if (paymentMethod === "MERCADO_PAGO") {
        expiresAt.setMinutes(expiresAt.getMinutes() + 15);
      } else {
        expiresAt.setHours(expiresAt.getHours() + 48);
      }

      const initialStatus =
        paymentMethod === "TRANSFER" ? "PENDING_VERIFICATION" : "PENDING";

      const newOrder = await OrderRepository.create(
        {
          userId,
          status: initialStatus,
          paymentMethod,
          totalAmount,
          receiptUrl,
          expiresAt,
        },
        tx as unknown as typeof db,
      );

      if (!newOrder) {
        throw new DatabaseError("No se pudo crear la orden");
      }

      // Insert order items using prices captured during atomic decrement
      for (const item of items) {
        await OrderRepository.insertItem(
          {
            orderId: newOrder.id,
            productId: item.productId,
            quantity: item.quantity,
            priceAtPurchase: priceByProductId.get(item.productId)!,
          },
          tx as unknown as typeof db,
        );
      }

      return newOrder;
    });
  }

  static async markOrderPaid(orderId: string, paymentId?: string) {
    const updated = await OrderRepository.markPaid(orderId, paymentId);
    if (!updated) {
      logger.warn({ orderId }, "order.mark_paid.skipped_non_pending");
    }
  }

  static async expireOrder(orderId: string) {
    return await db.transaction(async (tx) => {
      const order = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .for("update");

      if (!order[0]) return null;

      if (
        order[0].status === "PAID" ||
        order[0].status === "CANCELLED" ||
        order[0].status === "EXPIRED"
      ) {
        return null;
      }

      const items = await OrderRepository.findItemsByOrderId(
        orderId,
        tx as unknown as typeof db,
      );

      for (const item of items) {
        await tx
          .update(products)
          .set({ stock: sql`${products.stock} + ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      await OrderRepository.setStatus(
        orderId,
        "EXPIRED",
        undefined,
        tx as unknown as typeof db,
      );

      return order[0];
    });
  }

  static async cancelOrder(orderId: string) {
    return await db.transaction(async (tx) => {
      const order = await tx
        .select()
        .from(orders)
        .where(eq(orders.id, orderId));

      if (!order[0]) throw new NotFoundError("Orden no encontrada");

      if (
        order[0].status === "CANCELLED" ||
        order[0].status === "EXPIRED" ||
        order[0].status === "PAID"
      ) {
        return;
      }

      const items = await OrderRepository.findItemsByOrderId(
        orderId,
        tx as unknown as typeof db,
      );

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

      await OrderRepository.setStatus(
        orderId,
        "CANCELLED",
        undefined,
        tx as unknown as typeof db,
      );
    });
  }

  static async getOrderById(orderId: string): Promise<OrderWithItems> {
    const order = await OrderRepository.findByIdWithItems(orderId);
    if (!order) {
      throw new NotFoundError("Orden no encontrada");
    }
    return order;
  }

  static async getUserOrders(
    userId: string,
    page: number,
    limit: number,
    sortBy: string = "createdAt",
    sortOrder: "asc" | "desc" = "desc",
    status?: string,
  ) {
    const [data, total] = await Promise.all([
      OrderRepository.findByUserId(userId, { page, limit, sortBy, sortOrder, status }),
      OrderRepository.countByUserId(userId, status),
    ]);

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
    includeItems = false,
  ) {
    const [data, total] = await Promise.all([
      OrderRepository.findPaginated({ page, limit, sortBy, sortOrder, status, paymentMethod }),
      OrderRepository.countFiltered({ status, paymentMethod }),
    ]);

    let enriched: typeof data | Array<(typeof data)[0] & { items: any[] }> = data;

    if (includeItems && data.length > 0) {
      const orderIds = data.map((o) => o.id);
      const itemsByOrderId = await OrderRepository.findItemsByOrderIds(orderIds);

      enriched = data.map((order) => ({
        ...order,
        items: itemsByOrderId.get(order.id) ?? [],
      }));
    }

    return {
      data: enriched,
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
