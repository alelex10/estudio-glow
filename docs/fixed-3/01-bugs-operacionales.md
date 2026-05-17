# 01 — Bugs operacionales (checkout / órdenes)

> **ESTADO ACTUAL (2026-05-17):** ✅ Todos los bugs operacionales listados aquí están **RESUELTOS**. Quedan pendientes solo los tests de concurrencia (últimos 2 items del checklist).

**Prioridad:** P0 — pueden ocurrir en uso normal sin necesidad de atacante.
**Áreas:** `backend/src/services/OrderService.ts`, `backend/src/services/CronService.ts`, `backend/src/repositories/OrderRepository.ts`, `backend/src/routes/webhooks.ts`.

---

## 1.1 Race condition de stock en `createOrder` 🔴

**Archivo:** `backend/src/services/OrderService.ts:24-94`

**Problema:** la transacción hace `SELECT FROM products` + `UPDATE products SET stock = stock - X` sin `FOR UPDATE`. Dos transacciones concurrentes pueden leer el mismo stock inicial y ambas descontar, dejando stock negativo.

**Impacto:** oversell. Dos clientes con stock=1 → ambos crean orden, ambos esperan el producto, uno queda sin stock real.

**Fix sugerido:**
```ts
// Reemplazar SELECT + UPDATE por UPDATE atómico con guard:
const result = await tx
  .update(products)
  .set({ stock: sql`stock - ${quantity}` })
  .where(and(eq(products.id, productId), gte(products.stock, quantity)))
  .returning({ id: products.id, priceAtPurchase: products.price });

if (result.length === 0) {
  throw new InsufficientStockError(productId);
}
```

Bonus: el segundo loop (líneas 76-83) hace un SELECT más por cada item solo para leer `priceAtPurchase`. Con el `RETURNING` de arriba se elimina ese N+1 dentro de la transacción.

**Estado:** ✅ resuelto — `OrderService.createOrder` ahora hace `UPDATE products SET stock = stock - X WHERE id = ? AND stock >= X RETURNING ...` en un solo paso. N+1 eliminado vía `Map<productId, price>`.

---

## 1.2 Cron pisa órdenes pagadas 🔴

**Archivo:** `backend/src/services/CronService.ts:40-55`

**Problema:** `expireOrdersTick` llama `cancelOrder(id)` (que setea `CANCELLED` y restituye stock) y después fuerza UPDATE a `EXPIRED` sin transacción común. Si `cancelOrder` retornó early porque la orden ya estaba `PAID` (line 113-119), el UPDATE siguiente la pisa a `EXPIRED`.

**Impacto:** una orden que justo se pagó cuando vencía puede terminar marcada `EXPIRED` aunque el webhook ya la pasó a `PAID`. Estado imposible: orden pagada + cliente sin producto.

**Fix sugerido:** mover la lógica a `OrderService.expireOrder(id)` como operación atómica:
```ts
async expireOrder(id: string) {
  return db.transaction(async (tx) => {
    const order = await tx.select().from(orders)
      .where(and(eq(orders.id, id), eq(orders.status, 'PENDING')))
      .for('update');
    if (order.length === 0) return null; // ya terminó en otro estado

    await this.restoreStock(tx, id);
    await tx.update(orders).set({ status: 'EXPIRED' }).where(eq(orders.id, id));
    return order[0];
  });
}
```
El cron solo orquesta, no decide.

**Estado:** ✅ resuelto — `OrderService.expireOrder(id)` con `SELECT ... FOR UPDATE` + guard de estado terminal + restitución de stock + cambio a EXPIRED en una sola transacción. `CronService.expireOrdersTick` ahora solo orquesta y cuenta `expired/skipped`.

---

## 1.3 `markOrderPaid` sin guard de estado terminal 🔴

**Archivo:** `backend/src/routes/webhooks.ts` + `OrderRepository.setStatus`

**Problema:** el webhook llama `markOrderPaid(orderId)` sin validar el estado actual. Si llega tarde (red lenta, retry de MP) sobre una orden ya `EXPIRED` con stock restituido, la pasa a `PAID` sin volver a descontar stock.

**Impacto:** cliente paga, no hay stock para enviarle.

**Fix sugerido:**
```ts
// En OrderRepository:
async markPaid(id: string, paymentId: string) {
  const result = await db.update(orders)
    .set({ status: 'PAID', mpPaymentId: paymentId })
    .where(and(eq(orders.id, id), eq(orders.status, 'PENDING')))
    .returning();
  return result[0] ?? null;
}
```
Si retorna `null`, loggear con `logger.warn` indicando que la orden ya no estaba en `PENDING`.

**Estado:** ✅ resuelto — `OrderRepository.markPaid(id, paymentId?)` hace UPDATE atómico con guard `NOT IN (PAID, CANCELLED, EXPIRED)`. `OrderService.markOrderPaid` acepta `paymentId` opcional y loggea `warn` si retorna null. Webhook y admin approveOrder actualizados como callers.

---

## 1.4 Filtros AND silenciosamente rotos en `OrderRepository` 🔴

**Archivo:** `backend/src/repositories/OrderRepository.ts:82-86, 95-99`

**Problema:** el patrón
```ts
query = query.where(eq(orders.status, status)) as typeof query;
query = query.where(eq(orders.paymentMethod, paymentMethod)) as typeof query;
```
reemplaza el filtro previo en vez de combinarlo. Drizzle prohíbe llamar `.where()` dos veces; el cast `as typeof query` lo silencia.

**Impacto:** `GET /orders?status=PAID&paymentMethod=TRANSFER` ignora uno de los filtros silenciosamente. El admin filtra y ve resultados incorrectos sin warning.

**Fix sugerido:** el mismo patrón que usa `ProductRepository.buildFilters`:
```ts
const conditions: SQL[] = [];
if (status) conditions.push(eq(orders.status, status));
if (paymentMethod) conditions.push(eq(orders.paymentMethod, paymentMethod));
const query = db.select().from(orders)
  .where(conditions.length ? and(...conditions) : undefined);
```

Mismo bug latente en `ProductRepository.search:213-215` con `(query as any).where(...)`.

**Estado:** ✅ resuelto — `OrderRepository.findPaginated` y `countFiltered` usan patrón `conditions: SQL[] + and(...conditions)`. `ProductRepository.search` reescrito con mismo patrón eliminando los `(query as any).where(...)` casts.

---

## 1.5 `JSON.parse` sin try/catch en checkout 🟠

**Archivo:** `frontend/app/routes/checkout/checkout.tsx:44`

**Problema:** `const items = JSON.parse(cartItemsRaw)` revienta el action con 500 si el cliente manda un payload corrupto (extensión, devtools, replay modificado). No valida shape.

**Impacto:** UX rota (500 en lugar de error legible) + posibles campos inesperados enviados al backend.

**Fix sugerido:** wrap con try/catch + validar con zod:
```ts
const cartItemsSchema = z.array(z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().min(1),
}));

let items: z.infer<typeof cartItemsSchema>;
try {
  items = cartItemsSchema.parse(JSON.parse(cartItemsRaw));
} catch {
  return { error: { code: 'INVALID_CART', message: 'Carrito inválido' } };
}
```

**Estado:** ✅ resuelto — `JSON.parse` envuelto en try/catch con validación zod (`cartItemsSchema`) en `checkout.tsx`. Retorna `{ error: 'Carrito inválido' }` en lugar de 500.

---

## 1.6 `expireOrdersTick` no es transaccional con `cancelOrder` 🟠

**Archivo:** `backend/src/services/CronService.ts:40-55`

**Relacionado con #1.2.** Aun fuera del bug de pisado, las dos operaciones (restituir stock + cambiar estado) deberían correr dentro de una sola transacción para evitar estado inconsistente si el server cae a la mitad.

**Estado:** ✅ resuelto junto con #1.2 — todo dentro de `db.transaction` en `OrderService.expireOrder`.

---

## Checklist

- [x] 1.1 Race condition de stock
- [x] 1.2 Cron pisa órdenes pagadas
- [x] 1.3 `markOrderPaid` sin guard
- [x] 1.4 Filtros AND rotos en OrderRepository
- [x] 1.5 JSON.parse sin try/catch
- [x] 1.6 Transaccionalidad de `expireOrdersTick`
- [ ] Tests de concurrencia para `createOrder` (stock=1, 2 promesas paralelas)
- [ ] Tests para `markOrderPaid` sobre orden ya `EXPIRED`
