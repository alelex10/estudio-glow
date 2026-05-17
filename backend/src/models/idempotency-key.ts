import {
  pgTable,
  varchar,
  timestamp,
  integer,
  boolean,
  jsonb,
  index,
  primaryKey,
} from "drizzle-orm/pg-core";

/**
 * Persistent idempotency store.
 *
 * Replaces the in-memory Map in middleware/idempotency.ts so that retried
 * requests are safe across restarts and in multi-instance deployments.
 *
 * Composite PK (user_id, key) guarantees exactly-once semantics per user.
 * The `inflight` flag distinguishes an in-progress request (409 Retry-After)
 * from a completed one (replay cached response).
 */
export const idempotencyKeys = pgTable(
  "idempotency_key",
  {
    userId: varchar("user_id", { length: 36 }).notNull(),
    key: varchar("key", { length: 255 }).notNull(),
    responseJson: jsonb("response_json"),
    statusCode: integer("status_code"),
    inflight: boolean("inflight").notNull().default(true),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    primaryKey({ columns: [table.userId, table.key] }),
    index("idx_idempotency_expires_at").on(table.expiresAt),
  ],
);

export type IdempotencyKey = typeof idempotencyKeys.$inferSelect;
export type NewIdempotencyKey = typeof idempotencyKeys.$inferInsert;
