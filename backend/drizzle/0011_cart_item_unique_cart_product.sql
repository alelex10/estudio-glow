-- Deduplicate existing cart_item rows by (cart_id, product_id).
-- Strategy: keep the OLDEST row per (cart_id, product_id), sum quantities into
-- it (capped by current product stock, floored at 1), then delete younger duplicates.
-- Finally, add a UNIQUE constraint so concurrent INSERTs can no longer create
-- duplicate rows (fixes the SELECT-then-INSERT race in CartService.addItem).

WITH dups AS (
  SELECT
    cart_id,
    product_id,
    (array_agg(id ORDER BY created_at ASC, id ASC))[1] AS keep_id,
    SUM(quantity)::int AS total_qty
  FROM cart_item
  GROUP BY cart_id, product_id
  HAVING COUNT(*) > 1
)
UPDATE cart_item ci
SET
  quantity = GREATEST(LEAST(d.total_qty, p.stock), 1),
  updated_at = NOW()
FROM dups d
JOIN product p ON p.id = d.product_id
WHERE ci.id = d.keep_id;
--> statement-breakpoint

DELETE FROM cart_item ci
USING (
  SELECT
    cart_id,
    product_id,
    (array_agg(id ORDER BY created_at ASC, id ASC))[1] AS keep_id
  FROM cart_item
  GROUP BY cart_id, product_id
  HAVING COUNT(*) > 1
) d
WHERE ci.cart_id = d.cart_id
  AND ci.product_id = d.product_id
  AND ci.id <> d.keep_id;
--> statement-breakpoint

ALTER TABLE "cart_item"
  ADD CONSTRAINT "cart_item_cart_product_unique" UNIQUE ("cart_id", "product_id");
