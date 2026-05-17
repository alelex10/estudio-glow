-- Migration 0006: email_verified column + auth_tokens table
-- Spec refs: F5.1, F5.2, F5.3, F5.4, F5.5, F5.6, S5-A

-- 1. Add email_verified column to user table (default false, NOT NULL)
ALTER TABLE "user" ADD COLUMN "email_verified" boolean NOT NULL DEFAULT false;

--> statement-breakpoint

-- 2. Grandfather all existing rows as verified (they registered before email verification existed)
UPDATE "user" SET "email_verified" = true;

--> statement-breakpoint

-- 3. Create auth_tokens table
CREATE TABLE "auth_tokens" (
  "id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" varchar(36) NOT NULL,
  "token_hash" varchar(64) NOT NULL,
  "type" text NOT NULL,
  "target_google_id" varchar(255),
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "auth_tokens_token_hash_unique" UNIQUE("token_hash"),
  CONSTRAINT "auth_tokens_type_chk" CHECK ("type" IN ('EMAIL_VERIFY', 'ACCOUNT_LINK'))
);

--> statement-breakpoint

-- 4. Foreign key: auth_tokens.user_id → user.id (cascade delete)
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_user_id_user_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

--> statement-breakpoint

-- 5. Indexes
-- F5.4: lookup by token_hash (token consumption path — O(1))
CREATE INDEX "auth_tokens_token_hash_idx" ON "auth_tokens" ("token_hash");

--> statement-breakpoint

-- F5.5: lookup prior tokens for invalidation by user_id + type
CREATE INDEX "auth_tokens_user_idx" ON "auth_tokens" ("user_id", "type");

--> statement-breakpoint

-- F5.6: efficient cron cleanup by expires_at
CREATE INDEX "auth_tokens_expires_idx" ON "auth_tokens" ("expires_at");
