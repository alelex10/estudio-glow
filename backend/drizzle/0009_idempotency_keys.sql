-- Migration 0009: Persistent idempotency keys table
-- Replaces the in-memory Map in middleware/idempotency.ts with a Postgres-backed
-- store that survives restarts and is safe in multi-instance deployments.

CREATE TABLE IF NOT EXISTS "idempotency_key" (
  "user_id" VARCHAR(36) NOT NULL,
  "key" VARCHAR(255) NOT NULL,
  "response_json" JSONB,
  "status_code" INTEGER,
  "inflight" BOOLEAN NOT NULL DEFAULT TRUE,
  "expires_at" TIMESTAMPTZ NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY ("user_id", "key")
);

CREATE INDEX IF NOT EXISTS "idx_idempotency_expires_at"
  ON "idempotency_key" ("expires_at");
