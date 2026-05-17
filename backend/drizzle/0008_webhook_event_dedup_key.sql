ALTER TABLE "webhook_event" DROP CONSTRAINT IF EXISTS "webhook_event_payment_id_unique";
-- Add action column if missing (idempotent)
ALTER TABLE "webhook_event" ADD COLUMN IF NOT EXISTS "action" varchar(64) NOT NULL DEFAULT 'unknown';
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_payment_id_action_unique" UNIQUE ("payment_id", "action");
