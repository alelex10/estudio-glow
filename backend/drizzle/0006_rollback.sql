-- ⚠️ REQUIRES BACKUP — DROP COLUMN email_verified loses irrecoverable data.
-- For large tables, batch the UPDATE: UPDATE "user" SET email_verified=true WHERE email_verified IS NULL LIMIT 1000; (repeat).
-- NOTE: _journal.json is NOT auto-updated by manual rollback.

-- Rollback for Migration 0006: email_verified column + auth_tokens table
-- Run this to revert 0006_email_verified_auth_tokens.sql

-- 1. Drop auth_tokens table (indexes and FK are dropped automatically)
DROP TABLE IF EXISTS "auth_tokens";

--> statement-breakpoint

-- 2. Remove email_verified column from user table
ALTER TABLE "user" DROP COLUMN IF EXISTS "email_verified";
