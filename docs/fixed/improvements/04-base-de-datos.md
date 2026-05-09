# 4. Base de Datos

> Stack: PostgreSQL + Drizzle ORM 0.45 + postgres-js 3.4. Migraciones con `drizzle-kit generate`.
> Auditado: schema, índices, transacciones, N+1, migraciones, soft-delete, tipos, naming, seeds.

## Estado actual

Tablas definidas (`backend/src/models/`):
- `user` (`user.ts:4`) — id varchar(36) UUID, name, email (unique), password_hash (nullable, OK para Google), provider enum LOCAL/GOOGLE, google_id (unique), role admin/customer.
- `category` (`category.ts:4`) — id, name (unique), description.
- `product` (`product.ts:5`) — id, name (unique), description, price (`integer`), stock (`integer`), categoryId FK, imageUrl.
- `favorite` (`favorite.ts:6`) — id, userId, productId, unique compuesto (`unique_user_product`), `onDelete: cascade` en ambos FKs.
- `cart` (`cart.ts:6`) y `cart_item` (`cart.ts:13`) — cart.userId nullable (?), cart_item con cascade.
- `order` (`order.ts:6`) y `order_item` (`order.ts:19`) — order.status enum, totalAmount integer, paymentMethod enum, expiresAt nullable, mpPreferenceId.

Migraciones (`backend/drizzle/`):
- `0000_strong_monster_badoon.sql` — tablas iniciales (user, product, category).
- `0001_bent_jimmy_woo.sql` — favorites + provider/google_id en user.
- `0002_strange_zaran.sql` — cart, cart_item, order, order_item.
- `0003_jittery_hairball.sql` — (ver detalle más abajo).
- Carpeta huérfana `20260316113300_burly_namor/` con su propio `migration.sql` y `snapshot.json` que NO está en `meta/_journal.json`.

Cosas bien hechas:
- `db.transaction()` se usa en `OrderService.createOrder` (`OrderService.ts:14`) y `OrderService.cancelOrder` (`OrderService.ts:108`).
- Batch query con `inArray` para evitar N+1 al hidratar items de orders (`OrderService.ts:255-270`).
- Cascade correcto en `favorite` (`favorite.ts:10-13`), `cart_item` (`cart.ts:15`), `order_item` (`order.ts:21`).
- Unique compuesto en favorites previene duplicados.
- `priceAtPurchase` snapshot en `order_item` (`order.ts:24`) — patrón correcto: el precio histórico no cambia si se actualiza el producto.

## Problemas detectados

### 1. ALTO — Cero índices en columnas usadas en WHERE/JOIN

Evidencia (`grep "CREATE INDEX" drizzle/`): **no hay un solo índice creado**, sólo los implícitos por PRIMARY KEY y UNIQUE.

Columnas que se filtran o joinean sin índice:
- `cart.user_id` — `CartService.getCart` (`CartService.ts:9`) hace `WHERE user_id = ?` en cada request autenticado.
- `cart_item.cart_id` — usado en `CartService.getCart` (`:23`), `OrderService.createOrder` (`:25`), `:95`.
- `order.user_id` — `OrderService.getUserOrders` (`:196`), `:204`.
- `order.status` — filtrado en `getOrders` (`:236`) y crítico en el cron (`CronService.ts:14-16`).
- `order.expires_at` — `CronService.ts:13` `lt(orders.expiresAt, now)` corre cada minuto, full table scan.
- `order_item.order_id` — JOINs en `getOrderById` (`:173`) y `getOrders` (`:270`).
- `favorite.user_id` y `favorite.product_id` — listados (`favorite.ts` `listFavorites:88`, `:99`).
- `product.category_id` — filtrado en listing (`controller/product.ts:51`).
- `product.name` — `ilike` y `eq` (`controller/product.ts:38`, `:347`). El `unique` ayuda con `=` pero no con `ILIKE %x%`.

Impacto: a ~10k órdenes el cron escanea linealmente cada 60s. A ~100k productos el listing paginado se vuelve lento. CRÍTICO antes de producción a escala.

### 2. ALTO — `cart.user_id` es nullable y SIN unique constraint

Evidencia: `models/cart.ts:8` — `userId: varchar("user_id", { length: 36 }).references(() => users.id)` — sin `.notNull()` ni `.unique()`.

Impacto:
- `CartService.getCart` (`CartService.ts:9-15`) hace `select where userId = ?` y si no hay, crea uno. Pero **dos requests concurrentes del mismo usuario pueden crear DOS carritos** (race condition). El backend siempre toma `cart[0]` — el segundo queda huérfano para siempre.
- Permitir `userId NULL` deja la puerta abierta a carts huérfanos sin owner.

Fix: `userId: ... .notNull().unique()` o un `UPSERT ... ON CONFLICT DO NOTHING` con índice único.

### 3. ALTO — `users.created_at` y `users.updated_at` son nullable inconsistente con resto de modelos

Evidencia: `models/user.ts:12-13` — `defaultNow()` SIN `.notNull()`. Todos los demás modelos lo tienen `.notNull()` (ver `category.ts:8`, `product.ts:15`, `order.ts:15`).

Impacto: tipos generados marcan `created_at: Date | null`, código consumidor debe manejar el null sin razón.

### 4. ALTO — `product.price` y `order.total_amount` como `integer` sin documentación de unidad

Evidencia: `product.ts:9` `price: integer("price")`, `order.ts:10` `totalAmount: integer("total_amount")`, `order_item.ts:24` `priceAtPurchase: integer("price_at_purchase")`.

Pero el schema Zod de productos lo declara `z.number()` con ejemplo `1500.99` (`schemas/product.ts:18`, `:55`) — **mensaje contradictorio**.

Impacto: si la convención es "centavos" (correcta para evitar float drift en dinero), no está documentada y el frontend recibe `1500` sin saber si es ARS$1500 o ARS$15.00. Si la convención es "pesos enteros", se pierde precisión a la primera promo de "20% off".

Fix: definir convención centavos (industry standard) y documentar en cada modelo + actualizar schemas Zod a `z.number().int()` con comentario "amount in cents".

### 5. ALTO — `timestamp` sin timezone

Evidencia: TODOS los modelos usan `timestamp("...")` (sin `withTimezone: true`). Ej: `order.ts:14-16`, `user.ts:12-13`.

Impacto:
- Postgres almacena `TIMESTAMP WITHOUT TIME ZONE` → ambigüedad si el server cambia de TZ (Render → AWS → tu laptop dev).
- `expiresAt` (`order.ts:14`) lo seteás con `new Date()` (`OrderService.ts:51-56`) pero el cron compara `lt(orders.expiresAt, now)` (`CronService.ts:13`) — si server y BD difieren en TZ, las órdenes vencen mal.

Fix: `timestamp("...", { withTimezone: true })` en TODAS las columnas temporales. Migración aditiva.

### 6. MEDIO — `OrderService.createOrder` itera productos uno por uno dentro de la transacción

Evidencia: `OrderService.ts:29-49` — `for (const item of items)` hace `select` + `update` por producto. Y luego `:77-93` otro loop que vuelve a hacer `select` y `insert` por item. Para un cart de 5 items son ~15 queries dentro de un mismo lock.

Impacto: latencia + tiempo bajo lock pesimista. No es N+1 clásico (ya estamos en transacción), pero alarga la ventana de bloqueo.

Fix: una sola query `SELECT * FROM products WHERE id = ANY($1) FOR UPDATE` al inicio, validar stock en memoria, batch `INSERT INTO order_item VALUES (...), (...), (...)` y `UPDATE products SET stock = stock - CASE id WHEN ... END`.

Bonus: el `FOR UPDATE` evita race condition de stock entre dos checkouts simultáneos del mismo producto — actualmente NO la previene.

### 7. MEDIO — `cart` y `order` no usan `db.query.X.findMany({ with: { items: true } })` (relations)

Evidencia: `models/relations.ts:1-17` es un barrel de exports — **no hay `relations()` definidas**. No se aprovecha el query builder relacional de Drizzle.

`OrderService.getOrderById` (`:148-179`) hace dos queries (orden + items con join), y `getOrders+items` en `:251-287` sí evita N+1 con `inArray` pero con código manual y `Map`.

Impacto: el código sería más limpio y type-safe con `db.query.orders.findMany({ with: { items: { with: { product: true } } } })`. Funcionalmente OK, pero más boilerplate del necesario.

### 8. MEDIO — Sin soft-delete en orders/products/users

Evidencia: `controller/product.ts:306` `db.delete(products)` físico, `controller/category.ts:196` idem.

Impacto:
- Si borrás un producto, quedan `order_item` huérfanos: `order_item.product_id` tiene FK con `ON DELETE NO ACTION` (default Drizzle, ver `0002_strange_zaran.sql`) → el delete del producto **falla** con FK violation tan pronto como tenga una orden histórica. Hoy probablemente funciona porque hay pocos datos.
- Sin soft-delete, no podés recuperar un producto borrado por error y se rompe el detalle de órdenes pasadas.

Fix: agregar `deleted_at: timestamp` a `product`, `user`, `category`, `order`. Filtrar `IS NULL` por defecto. Para productos, si tiene `order_item` referenciados → marcar inactivo en vez de borrar.

### 9. MEDIO — Migración huérfana fuera del journal

Evidencia:
- `drizzle/20260316113300_burly_namor/migration.sql` existe (`backend/drizzle/`).
- `drizzle/meta/_journal.json` lista sólo `0000-0003`.

Impacto: esa migración NO se aplica con `drizzle-kit migrate`. Si fue una prueba manual, debe borrarse del repo. Si fue intencional, el journal está corrupto.

### 10. MEDIO — Seeds borran TODO sin protección de entorno

Evidencia: `seeds/index.ts:11-15` — `seedDb.delete(products); .delete(categoriesTable); .delete(usersTable);` sin chequear `NODE_ENV`.

Impacto: si alguien corre `bun run seed` apuntando a `DATABASE_URL` de producción, **truncate**. Idempotencia: NO (limpia y recrea, no es safe re-run).

Fix:
```ts
if (process.env.NODE_ENV === "production") {
  throw new Error("Seeds bloqueados en producción");
}
// Y/o usar UPSERT por nombre/email para idempotencia.
```

### 11. BAJO — UUID como `varchar(36)` en lugar de `uuid` nativo

Evidencia: TODOS los `id` son `varchar("id", { length: 36 }).default(sql`gen_random_uuid()`)` (ej. `product.ts:6`).

Impacto: Postgres tiene tipo `uuid` (16 bytes binarios) vs `varchar(36)` (37 bytes texto). Comparaciones `=` igualmente rápidas, pero los índices son ~2x más grandes y se pierde validación de formato a nivel BD.

Fix: `uuid("id").primaryKey().defaultRandom()` — pero requiere data migration cuidadosa.

### 12. BAJO — Naming inconsistente: `password_hash`/`google_id`/`created_at` vs `categoryId`/`imageUrl`/`createdAt`

Evidencia:
- `user.ts` usa snake_case: `password_hash` (`:8`), `google_id` (`:10`), `created_at` (`:12`), `updated_at` (`:13`).
- `product.ts`, `cart.ts`, `order.ts`, `favorite.ts`, `category.ts` usan camelCase TS con snake_case en columnas: `categoryId` → `category_id`, `createdAt` → `created_at`.

Las **columnas** SQL son consistentes (snake_case), pero los **campos TS** difieren. `user.created_at` vs `product.createdAt` rompe expectativas en el código consumidor.

Fix: renombrar campos TS de `user.ts` a camelCase manteniendo nombre SQL: `passwordHash: varchar("password_hash", ...)`, `googleId: ...`, `createdAt: ...`. Cambio de tipo, no de schema BD. Ajustar callers.

### 13. BAJO — Drizzle `prepare: false` en producción puede ser issue

Evidencia: `db.ts:13` — `postgres(connectionString, { prepare: false })`.

Comentario justifica con "Transaction pool mode" (Supabase pgbouncer). Está bien si usás Supabase con pgbouncer en transaction mode, pero pierde el cache de prepared statements (~10-15% más latencia por query).

Fix: si Render Postgres directo, `prepare: true`. Documentar en código por qué es false.

## Recomendaciones

Priorizadas:

### P1 — Migración aditiva con índices (resuelve #1)

```sql
-- 0004_add_indexes.sql
CREATE INDEX idx_cart_user_id ON cart(user_id);
CREATE INDEX idx_cart_item_cart_id ON cart_item(cart_id);
CREATE INDEX idx_order_user_id ON "order"(user_id);
CREATE INDEX idx_order_status ON "order"(status);
CREATE INDEX idx_order_expires_at ON "order"(expires_at) WHERE status IN ('PENDING','PENDING_VERIFICATION');
CREATE INDEX idx_order_item_order_id ON order_item(order_id);
CREATE INDEX idx_favorite_user_id ON favorite(user_id);
CREATE INDEX idx_product_category_id ON product(category_id);
CREATE INDEX idx_product_name_trgm ON product USING gin(name gin_trgm_ops);  -- para ILIKE
```

El último necesita `CREATE EXTENSION IF NOT EXISTS pg_trgm;`. Modelar también con `index("idx_...").on(...)` en Drizzle.

### P2 — Unique en `cart.user_id` + notNull (resuelve #2)

```ts
export const carts = pgTable("cart", {
  id: ...,
  userId: varchar("user_id", { length: 36 }).notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  ...
});
```

Y en `getCart`, usar UPSERT:
```ts
await tx.insert(carts).values({ userId }).onConflictDoNothing({ target: carts.userId });
```

### P3 — Convención de dinero documentada y schemas alineados (resuelve #4)

- Decidir: **centavos (integer)**.
- Renombrar `price` → `priceCents` en TS (mantener `price` SQL si querés evitar migración, vía `integer("price")`).
- Schemas Zod: `z.number().int().nonnegative()` — sin decimales.
- En el frontend, dividir por 100 al mostrar.

### P4 — `timestamp` con timezone (resuelve #5)

Migración aditiva: `ALTER TABLE "order" ALTER COLUMN expires_at TYPE timestamptz USING expires_at AT TIME ZONE 'UTC';` para todas las temporales.

### P5 — Lock pesimista + batch en `createOrder` (resuelve #6)

```ts
const productRows = await tx
  .select().from(products)
  .where(inArray(products.id, items.map(i => i.productId)))
  .for("update");

// Validar stock en memoria
// Batch insert order_items
await tx.insert(orderItems).values(items.map(i => ({...})));
```

### P6 — Definir `relations()` y usar query relacional (resuelve #7)

```ts
// models/relations.ts
import { relations } from "drizzle-orm";
export const orderRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  user: one(users, { fields: [orders.userId], references: [users.id] }),
}));
export const orderItemRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, { fields: [orderItems.orderId], references: [orders.id] }),
  product: one(products, { fields: [orderItems.productId], references: [products.id] }),
}));
```

Y reemplazar `OrderService.getOrders` con `db.query.orders.findMany({ with: { items: { with: { product: true } } } })`.

### P7 — Soft-delete en product/category (resuelve #8)

```ts
deletedAt: timestamp("deleted_at", { withTimezone: true }),
```
Y en queries: `.where(isNull(products.deletedAt))`. Para borrar: `update set deletedAt = now()`.

### P8 — Seeds idempotentes y bloqueados en prod (resuelve #10)

```ts
if (process.env.NODE_ENV === "production") throw new Error("seeds prohibidos en prod");
// usar onConflictDoUpdate por email/name
```

### P9 — Limpieza de drift de migraciones (resuelve #9)

Borrar `drizzle/20260316113300_burly_namor/` o regenerar journal. Decidir y ejecutar.

## Referencias

- PostgreSQL — `B-tree indexes` y `gin_trgm_ops` para LIKE — https://www.postgresql.org/docs/current/pgtrgm.html
- Drizzle Relations API — https://orm.drizzle.team/docs/rqb
- Drizzle Indexes — https://orm.drizzle.team/docs/indexes-constraints
- Postgres `timestamptz` rationale — https://wiki.postgresql.org/wiki/Don%27t_Do_This#Don.27t_use_timestamp_.28without_time_zone.29
- Money in databases — Martin Fowler "Money" pattern; usar enteros en menor unidad.
- `SELECT FOR UPDATE` para concurrencia de stock — https://www.postgresql.org/docs/current/explicit-locking.html
