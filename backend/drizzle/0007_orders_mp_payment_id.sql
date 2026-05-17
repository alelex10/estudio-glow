ALTER TABLE "order" ADD COLUMN "mp_payment_id" varchar(255);
CREATE INDEX "idx_order_mp_payment_id" ON "order"("mp_payment_id");
