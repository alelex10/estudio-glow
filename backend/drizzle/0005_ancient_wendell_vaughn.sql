CREATE TABLE "webhook_event" (
	"id" varchar(36) PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"payment_id" text NOT NULL,
	"type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_event_payment_id_unique" UNIQUE("payment_id")
);
