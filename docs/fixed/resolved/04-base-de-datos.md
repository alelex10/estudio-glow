# Issues resueltos de Base de Datos

> Espejo de [`04-base-de-datos.md`](../improvements/04-base-de-datos.md) — issues resueltos.

---

### ✅ [ALTO] Índices en columnas usadas en WHERE/JOIN

**Issue original**: Issue #1 (original) — cero índices en toda la base. PostgreSQL no indexa FKs automáticamente.

**Solución**: Agregados 7 índices B-tree + UNIQUE en `cart.user_id`:

| Índice | Tabla | Columna | Propósito |
|---|---|---|---|
| `idx_cart_item_cart_id` | `cart_item` | `cart_id` | FK + JOIN en OrderService |
| `idx_favorite_user_id` | `favorite` | `user_id` | FK + WHERE en listFavorites |
| `idx_order_item_order_id` | `order_item` | `order_id` | FK + JOIN en getOrderById |
| `idx_order_user_id` | `order` | `user_id` | FK + WHERE en getUserOrders |
| `idx_order_status` | `order` | `status` | WHERE en admin + cron |
| `idx_order_expires_at` | `order` | `expires_at` | WHERE `lt` en cron (cada 60s) |
| `idx_product_category_id` | `product` | `category_id` | FK + WHERE en listing |

---

### ✅ [ALTO] `cart.user_id` nullable y sin UNIQUE

**Issue original**: Issue #2 (original) — `cart.user_id` permitía NULL y múltiples carritos por usuario.

**Solución**: 
- `.notNull().unique()` en el modelo Drizzle
- Migración con data cleanup: elimina carritos huérfanos y desduplica usuarios con múltiples carritos
- FK con `onDelete: cascade`

**Archivos**: `backend/src/models/cart.ts`, `backend/drizzle/0004_giant_rocket_raccoon.sql`.

---

### ✅ [LIMPIEZA] Drift de migraciones

**Issue original**: Issue #9 (original) — carpeta huérfana `drizzle/20260316113300_burly_namor/` fuera del journal, y migración `0004_unusual_lyja.sql` generada pero no registrada en `_journal.json`.

**Solución**: 
- Eliminada carpeta huérfana
- Eliminada vieja `0004_unusual_lyja.sql` no registrada
- Regenerada `0004_giant_rocket_raccoon.sql` desde los modelos actualizados, con journal actualizado automáticamente por `drizzle-kit generate`
- Aplicada a base de datos via `bun run migrate`
