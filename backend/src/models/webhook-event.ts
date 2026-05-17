import { pgTable, varchar, text, timestamp, unique } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export const webhookEvents = pgTable("webhook_event", {
  id: varchar("id", { length: 36 }).primaryKey().default(sql`gen_random_uuid()`),
  paymentId: text("payment_id").notNull(),
  action: varchar("action", { length: 64 }).notNull().default("unknown"),
  type: text("type").notNull(),
  processedAt: timestamp("processed_at").notNull().defaultNow(),
}, (table) => [
  unique("webhook_event_payment_id_action_unique").on(table.paymentId, table.action),
]);

export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type NewWebhookEvent = typeof webhookEvents.$inferInsert;
