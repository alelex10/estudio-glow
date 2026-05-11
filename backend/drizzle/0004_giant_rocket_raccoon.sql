-- Limpiar carritos huérfanos antes de agregar NOT NULL
DELETE FROM "cart_item" WHERE "cart_id" IN (SELECT "id" FROM "cart" WHERE "user_id" IS NULL);
DELETE FROM "cart" WHERE "user_id" IS NULL;
--> statement-breakpoint

-- Desduplicar: para usuarios con múltiples carritos, consolidar items al más reciente
WITH dupe_users AS (
  SELECT "user_id", array_agg("id" ORDER BY "created_at" DESC) AS ids
  FROM "cart"
  WHERE "user_id" IS NOT NULL
  GROUP BY "user_id"
  HAVING COUNT(*) > 1
)
UPDATE "cart_item" ci
SET "cart_id" = (dupe_users.ids)[1]
FROM dupe_users
WHERE ci."cart_id" = ANY(dupe_users.ids[2:]);
--> statement-breakpoint
DELETE FROM "cart" WHERE "id" IN (
  SELECT unnest(sub.ids[2:]) FROM (
    SELECT array_agg("id" ORDER BY "created_at" DESC) AS ids
    FROM "cart"
    WHERE "user_id" IS NOT NULL
    GROUP BY "user_id"
    HAVING COUNT(*) > 1
  ) AS sub
);
--> statement-breakpoint

ALTER TABLE "cart" DROP CONSTRAINT "cart_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "cart" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_cart_item_cart_id" ON "cart_item" USING btree ("cart_id");--> statement-breakpoint
CREATE INDEX "idx_favorite_user_id" ON "favorite" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_order_item_order_id" ON "order_item" USING btree ("order_id");--> statement-breakpoint
CREATE INDEX "idx_order_user_id" ON "order" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_order_status" ON "order" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_order_expires_at" ON "order" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "idx_product_category_id" ON "product" USING btree ("category_id");--> statement-breakpoint
ALTER TABLE "cart" ADD CONSTRAINT "cart_user_id_unique" UNIQUE("user_id");