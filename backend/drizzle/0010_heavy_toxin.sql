CREATE TABLE "idempotency_key" (
	"user_id" varchar(36) NOT NULL,
	"key" varchar(255) NOT NULL,
	"response_json" jsonb,
	"status_code" integer,
	"inflight" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "idempotency_key_user_id_key_pk" PRIMARY KEY("user_id","key")
);
--> statement-breakpoint
ALTER TABLE "webhook_event" DROP CONSTRAINT "webhook_event_payment_id_unique";--> statement-breakpoint
ALTER TABLE "auth_tokens" DROP CONSTRAINT "auth_tokens_type_chk";--> statement-breakpoint
ALTER TABLE "order" ADD COLUMN "mp_payment_id" varchar(255);--> statement-breakpoint
ALTER TABLE "webhook_event" ADD COLUMN "action" varchar(64) DEFAULT 'unknown' NOT NULL;--> statement-breakpoint
CREATE INDEX "idx_idempotency_expires_at" ON "idempotency_key" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_order_mp_payment_id" ON "order" USING btree ("mp_payment_id");--> statement-breakpoint
ALTER TABLE "webhook_event" ADD CONSTRAINT "webhook_event_payment_id_action_unique" UNIQUE("payment_id","action");--> statement-breakpoint
ALTER TABLE "auth_tokens" ADD CONSTRAINT "auth_tokens_type_chk" CHECK ("auth_tokens"."type" IN ('EMAIL_VERIFY', 'ACCOUNT_LINK', 'SET_PASSWORD'));