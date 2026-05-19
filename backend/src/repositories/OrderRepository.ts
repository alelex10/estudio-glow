import { db } from "../db";
import { orders, orderItems } from "../models/order";
import { products } from "../models/product";
import { eq, desc, asc, count, inArray, and, lt, ne, type SQL } from "drizzle-orm";
import type { Order, NewOrder, OrderItem, NewOrderItem, OrderWithItems } from "../models/order";

export type { Order, NewOrder, OrderItem, NewOrderItem, OrderWithItems };

export type OrderItemWithProduct = {
  id: string;
  orderId: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
};

export type OrderPaginatedOpts = {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  status?: string;
  paymentMethod?: string;
};

export class OrderRepository {
  // ---------------------------------------------------------------------------
  // Single order queries
  // ---------------------------------------------------------------------------

  static async findById(id: string): Promise<Order | undefined> {
    const result = await db
      .select()
      .from(orders)
      .where(eq(orders.id, id))
      .limit(1);
    return result[0];
  }

  static async findByIdWithItems(id: string): Promise<OrderWithItems | undefined> {
    const order = await OrderRepository.findById(id);
    if (!order) return undefined;

    const items = await db
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
      .where(eq(orderItems.orderId, id));

    return { ...order, items };
  }

  // ---------------------------------------------------------------------------
  // Paginated list queries
  // ---------------------------------------------------------------------------

  static async findPaginated(opts: OrderPaginatedOpts) {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", status, paymentMethod } = opts;
    const offset = (page - 1) * limit;
    const orderFn = sortOrder === "desc" ? desc : asc;
    const sortByColumn = sortBy === "createdAt" ? orders.createdAt : orders.totalAmount;

    const conditions: SQL[] = [];
    if (status) conditions.push(eq(orders.status, status as any));
    if (paymentMethod) conditions.push(eq(orders.paymentMethod, paymentMethod as any));

    const data = await db
      .select()
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderFn(sortByColumn))
      .limit(limit)
      .offset(offset);

    return data;
  }

  static async countFiltered(opts: Pick<OrderPaginatedOpts, "status" | "paymentMethod">): Promise<number> {
    const conditions: SQL[] = [];
    if (opts.status) conditions.push(eq(orders.status, opts.status as any));
    if (opts.paymentMethod) conditions.push(eq(orders.paymentMethod, opts.paymentMethod as any));

    const [result] = await db
      .select({ total: count() })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    return result?.total ?? 0;
  }

  /** Fetch items for a batch of order IDs in a single query, grouped by orderId. */
  static async findItemsByOrderIds(
    orderIds: string[],
  ): Promise<Map<string, OrderItemWithProduct[]>> {
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

    const map = new Map<string, OrderItemWithProduct[]>();
    for (const item of allItems) {
      const group = map.get(item.orderId);
      if (group) {
        group.push(item);
      } else {
        map.set(item.orderId, [item]);
      }
    }
    return map;
  }

  // ---------------------------------------------------------------------------
  // User-scoped queries
  // ---------------------------------------------------------------------------

  static async findByUserId(
    userId: string,
    opts: { page: number; limit: number; sortBy?: string; sortOrder?: "asc" | "desc"; status?: string },
  ) {
    const { page, limit, sortBy = "createdAt", sortOrder = "desc", status } = opts;
    const offset = (page - 1) * limit;
    const orderFn = sortOrder === "desc" ? desc : asc;
    const sortByColumn = sortBy === "createdAt" ? orders.createdAt : orders.totalAmount;

    const conditions: SQL[] = [eq(orders.userId, userId)];
    if (status) conditions.push(eq(orders.status, status as any));

    return db
      .select()
      .from(orders)
      .where(and(...conditions))
      .orderBy(orderFn(sortByColumn))
      .limit(limit)
      .offset(offset);
  }

  static async countByUserId(userId: string, status?: string): Promise<number> {
    const conditions: SQL[] = [eq(orders.userId, userId)];
    if (status) conditions.push(eq(orders.status, status as any));

    const [result] = await db
      .select({ total: count() })
      .from(orders)
      .where(and(...conditions));
    return result?.total ?? 0;
  }

  // ---------------------------------------------------------------------------
  // Mutation helpers (used inside transactions — accept optional tx)
  // ---------------------------------------------------------------------------

  /** Insert a new order row and return the created row. */
  static async create(
    data: NewOrder,
    tx?: typeof db,
  ): Promise<Order> {
    const client = tx ?? db;
    const [newOrder] = await (client as typeof db)
      .insert(orders)
      .values(data)
      .returning();
    if (!newOrder) throw new Error("Failed to create order");
    return newOrder;
  }

  static async insertItem(data: NewOrderItem, tx?: typeof db): Promise<void> {
    const client = tx ?? db;
    await (client as typeof db).insert(orderItems).values(data);
  }

  static async setStatus(
    id: string,
    status: Order["status"],
    extra?: Partial<Pick<Order, "expiresAt">>,
    tx?: typeof db,
  ): Promise<void> {
    const client = tx ?? db;
    await (client as typeof db)
      .update(orders)
      .set({ status, ...extra })
      .where(eq(orders.id, id));
  }

  /**
   * Atomically transition an order to PAID, clearing expiresAt and storing
   * the MercadoPago payment ID. Only updates if the order is currently in a
   * non-terminal, payable state (PENDING or PENDING_VERIFICATION). Returns
   * the updated row or null when the order was already terminal.
   */
  static async markPaid(id: string, paymentId?: string): Promise<Order | null> {
    const result = await db
      .update(orders)
      .set({ status: "PAID", expiresAt: null, ...(paymentId ? { mpPaymentId: paymentId } : {}) })
      .where(
        and(
          eq(orders.id, id),
          // Guard: only transition from non-terminal payable states
          // (covers both MP webhook path and admin approveOrder path)
          and(
            ne(orders.status, "PAID"),
            ne(orders.status, "CANCELLED"),
            ne(orders.status, "EXPIRED"),
          ),
        ),
      )
      .returning();
    return result[0] ?? null;
  }

  static async findItemsByOrderId(orderId: string, tx?: typeof db): Promise<OrderItem[]> {
    const client = tx ?? db;
    return (client as typeof db)
      .select()
      .from(orderItems)
      .where(eq(orderItems.orderId, orderId));
  }

  // ---------------------------------------------------------------------------
  // CronService support
  // ---------------------------------------------------------------------------

  /** Find all non-terminal orders whose expiresAt is in the past. */
  static async findExpired(now: Date): Promise<Order[]> {
    return db
      .select()
      .from(orders)
      .where(
        and(
          lt(orders.expiresAt, now),
          ne(orders.status, "PAID"),
          ne(orders.status, "CANCELLED"),
          ne(orders.status, "EXPIRED"),
        ),
      );
  }

  /**
   * Find PENDING MercadoPago orders that expire within the next 30 minutes.
   * Used by the reconciliation cron to detect approved payments whose webhook
   * was missed (e.g. MP network error, rotated secret, etc.).
   */
  static async findPendingNearExpiry(): Promise<Order[]> {
    const thirtyMinutesFromNow = new Date(Date.now() + 30 * 60 * 1000);
    return db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.status, "PENDING"),
          eq(orders.paymentMethod, "MERCADO_PAGO"),
          lt(orders.expiresAt, thirtyMinutesFromNow),
        ),
      );
  }
}
