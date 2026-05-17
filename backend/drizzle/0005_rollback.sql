-- REQUIRES BACKUP — destructive
-- Rollback for Migration 0005: webhook_event table
-- Run this to revert 0005_ancient_wendell_vaughn.sql
--
-- NOTE: _journal.json is NOT auto-updated by manual rollback.
-- Verify no webhook_event rows exist that you wish to keep before running.

-- 1. Drop the unique constraint (implicit from the UNIQUE column definition)
--    The constraint is named automatically by Postgres; dropping the table handles it.

-- 2. Drop the webhook_event table (drops the unique index on payment_id automatically)
DROP TABLE IF EXISTS "webhook_event";
