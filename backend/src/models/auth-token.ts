import { pgTable, varchar, timestamp, text, index, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { users } from "./user";

export const authTokens = pgTable(
  "auth_tokens",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    user_id: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // sha256 hex of the raw token — raw token is NEVER stored (N1.1)
    token_hash: varchar("token_hash", { length: 64 }).notNull().unique(),
    type: text("type", { enum: ["EMAIL_VERIFY", "ACCOUNT_LINK"] }).notNull(),
    // only populated for ACCOUNT_LINK tokens (F3.4)
    target_google_id: varchar("target_google_id", { length: 255 }),
    expires_at: timestamp("expires_at").notNull(),
    used_at: timestamp("used_at"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({
    // F5.4: explicit named index for token_hash consumption lookups
    // (redundant with the .unique() auto-index, but declared here so
    // `drizzle-kit generate` won't emit a DROP INDEX migration drifting from 0006)
    byTokenHash: index("auth_tokens_token_hash_idx").on(t.token_hash),
    // F5.5: lookup prior tokens for invalidation by user + type
    byUser: index("auth_tokens_user_idx").on(t.user_id, t.type),
    // F5.6: efficient cron cleanup
    byExpires: index("auth_tokens_expires_idx").on(t.expires_at),
    // F5.3: enforce type discriminator at the DB level (defense in depth
    // alongside the TS enum). Drift between 0006 SQL and this constraint
    // is what caused the original 0007_legal_the_leader.sql drop.
    typeCheck: check(
      "auth_tokens_type_chk",
      sql`${t.type} IN ('EMAIL_VERIFY', 'ACCOUNT_LINK')`,
    ),
  }),
);

export type AuthToken = typeof authTokens.$inferSelect;
export type NewAuthToken = typeof authTokens.$inferInsert;
