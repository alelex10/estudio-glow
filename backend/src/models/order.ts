import { pgTable, varchar, timestamp, integer, text } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";
import { products } from "./product";

export const orders = pgTable("order", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id", { length: 36 }).notNull().references(() => users.id),
  status: text("status", { enum: ["PENDING", "PAID", "PENDING_VERIFICATION", "CANCELLED", "EXPIRED"] }).notNull().default("PENDING"),
  totalAmount: integer("total_amount").notNull(),
  paymentMethod: text("payment_method", { enum: ["MERCADO_PAGO", "TRANSFER"] }).notNull(),
  receiptUrl: varchar("receipt_url", { length: 255 }),
  mpPreferenceId: varchar("mp_preference_id", { length: 255 }),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const orderItems = pgTable("order_item", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  orderId: varchar("order_id", { length: 36 }).notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: varchar("product_id", { length: 36 }).notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  priceAtPurchase: integer("price_at_purchase").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;
export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

export type OrderWithItems = Order & {
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    priceAtPurchase: number;
    product: {
      id: string;
      name: string;
      imageUrl: string | null;
    };
  }>;
};
