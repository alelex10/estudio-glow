# 02 — Pagos y MercadoPago

**Prioridad:** P1 — algunos son P0 ANTES de habilitar el botón de MP en la UI (hoy está disabled).
**Áreas:** `backend/src/routes/webhooks.ts`, `backend/src/services/MercadoPagoService.ts`, `backend/src/middleware/idempotency.ts`, `backend/src/services/WebhookEventService.ts`, `backend/src/models/order.ts`.

---

## 2.1 `payment_id` de MercadoPago no se persiste en `orders` 🔴

**Archivo:** `backend/src/models/order.ts` + `backend/src/routes/webhooks.ts`

**Problema:** la tabla `orders` no tiene columna `mp_payment_id`. El webhook usa solo `external_reference` (orderId) para encontrar la orden, pero nunca guarda el `payment.id` real que devuelve MercadoPago.

**Impacto:** cuando un cliente reclama "pagué y no me llegó", no se puede buscar en MP. Sin auditoría, sin reembolsos automatizados, sin soporte efectivo.

**Fix sugerido:**
1. Nueva migración `0007_orders_mp_payment_id.sql`:
   ```sql
   ALTER TABLE orders ADD COLUMN mp_payment_id TEXT;
   CREATE INDEX orders_mp_payment_id_idx ON orders(mp_payment_id);
   ```
2. En `markOrderPaid`, persistir `payment.id` junto con el cambio de estado (ver fix de 1.3).

**Estado:** ✅ resuelto — columna `mp_payment_id varchar(255)` + índice `idx_order_mp_payment_id` añadidos al modelo `order.ts`. Migración `0007_orders_mp_payment_id.sql` creada. `markOrderPaid` ahora persiste el `paymentId` recibido del webhook.

---

## 2.2 Webhooks no-approved se descartan silenciosamente 🔴

**Archivo:** `backend/src/routes/webhooks.ts:34`

**Problema:** solo `payment.status === "approved"` actúa. Los estados `rejected`, `cancelled`, `refunded`, `charged_back`, `in_process` no hacen nada. La orden queda `PENDING` hasta que el cron la expire (48 h) aunque MP la rechazó hace 5 minutos.

**Impacto:**
- Reembolsos no se reflejan en la app.
- Contracargos no se registran.
- UX: el cliente cuyo pago fue rechazado ve "PENDING" durante 48 h.

**Fix sugerido:** mapeo explícito por status:
```ts
switch (payment.status) {
  case 'approved':
    await orderService.markPaid(externalReference, payment.id);
    break;
  case 'rejected':
  case 'cancelled':
    await orderService.cancelOrder(externalReference, 'PAYMENT_REJECTED');
    break;
  case 'refunded':
  case 'charged_back':
    await orderService.markRefunded(externalReference, payment.id);
    break;
  case 'in_process':
  case 'pending':
    logger.info({ orderId: externalReference, status: payment.status }, 'payment.in_progress');
    break;
  default:
    logger.warn({ status: payment.status }, 'payment.unknown_status');
}
```

**Estado:** ✅ resuelto — `routes/webhooks.ts` reemplaza el `if approved` por un `switch` completo: `approved` → `markOrderPaid`, `rejected/cancelled` → `cancelOrder`, `refunded/charged_back` → log warn (markRefunded pendiente como follow-up), `in_process/pending` → log info, default → log warn.

---

## 2.3 Sin reconciliación de órdenes con MercadoPago 🔴

**Problema:** si MP no manda el webhook (red, secret rotado, bug), la orden expira y se restituye stock aunque el cliente haya pagado. Esto es **el problema más común en producción con MP**.

**Fix sugerido:** cron `reconcileOrdersTick` que corra cada 5 min sobre órdenes `PENDING` próximas a vencer (ej. `expiresAt < now + 30min` y `paymentMethod = MERCADO_PAGO`):
```ts
async reconcileOrdersTick() {
  const candidates = await orderRepository.findPendingNearExpiry();
  for (const order of candidates) {
    const payment = await mpService.findByExternalReference(order.id);
    if (payment?.status === 'approved') {
      await orderService.markPaid(order.id, payment.id);
    }
  }
}
```

**Estado:** ✅ resuelto — `reconcileOrdersTick` añadido en `CronService.ts`; usa `OrderRepository.findPendingNearExpiry()` (nuevo método) y `MercadoPagoService.findByExternalReference()` (nuevo método); se ejecuta cada 5 min con advisory lock `MP_RECONCILE_LOCK_KEY`.

---

## 2.4 Idempotency in-memory 🟠

**Archivo:** `backend/src/middleware/idempotency.ts:23`

**Problema:** el cache es un `Map` local del proceso. Con 1 instancia funciona; tras un restart o si se escala, dos requests con el mismo `Idempotency-Key` crean dos órdenes.

**Impacto:** doble orden + doble preferencia MP si el cliente hace retry justo durante un deploy.

**Fix sugerido (mínimo para esta web):** persistir en Postgres:
```sql
CREATE TABLE idempotency_keys (
  user_id UUID NOT NULL,
  key TEXT NOT NULL,
  response_json JSONB NOT NULL,
  status_code INT NOT NULL,
  inflight BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  PRIMARY KEY (user_id, key)
);
```
Y limpiar en un cron.

**Mientras tanto:** documentar como `instances = 1` y agregar warning si el proceso recibe SIGTERM con entries `inflight=true`.

**Estado:** ✅ resuelto — `idempotency.ts` reescrito con Postgres (`idempotency_key` table). `INSERT ... ON CONFLICT DO NOTHING RETURNING *` garantiza exactly-once; respuesta persistida en `res.on('finish')`; inflight liberado en `res.on('close')`. Modelo `models/idempotency-key.ts` + migración `0009_idempotency_keys.sql` creados.

---

## 2.5 Inflight lock no se libera siempre 🟠

**Archivo:** `backend/src/middleware/idempotency.ts:73,83`

**Problema:** el monkey-patch a `res.json` libera el lock. Si el handler responde con `res.send`, `res.end`, redirect, o si la conexión se cierra antes de responder, la entrada queda `inflight=true` por 10 minutos. Bloquea reintentos legítimos.

**Fix sugerido:**
```ts
res.on('finish', () => releaseInflight(key));
res.on('close', () => releaseInflight(key));
```
Y un TTL corto (30 s) específico para el inflight, separado del TTL del cache.

**Estado:** ✅ resuelto — `idempotency.ts` usa `res.on('finish')` para persistir respuesta y `res.on('close')` para liberar inflight cuando la conexión se cierra antes de terminar. TTL inflight: 30s separado del TTL de cache (10min).

---

## 2.6 `MercadoPagoService` usa `process.env` directo con default peligroso 🟠

**Archivo:** `backend/src/services/MercadoPagoService.ts:5,11`

**Problema:**
```ts
const accessToken = process.env.MP_ACCESS_TOKEN || 'APP_USR-testing_token';
const webhookUrl = process.env.WEBHOOK_URL || 'https://your-ngrok.url/...';
```
Si falta la env en prod, MP arranca con token fake silenciosamente. Se descubre cuando un cliente intenta pagar.

**Fix sugerido:** consumir desde `env` validado con Zod (que ya existe). Si la env no está en prod, debe fallar el boot.

**Estado:** ✅ resuelto — `env.ts` agrega `WEBHOOK_URL` al schema Zod con guard de producción (falla boot si falta) y warning en dev/test. `MercadoPagoService.ts` reemplaza `process.env.MP_ACCESS_TOKEN || 'APP_USR-testing_token'` con `env.MP_ACCESS_TOKEN` y `process.env.WEBHOOK_URL` con `env.WEBHOOK_URL`.

---

## 2.7 `WebhookEventService.recordOrSkip` ignora `action`/status 🟡

**Archivo:** `backend/src/services/WebhookEventService.ts`

**Problema:** la clave de dedup es solo `payment_id`. Si MP manda primero `payment.updated approved` y después `refunded` con el mismo `payment.id`, el segundo se descarta como duplicado.

**Fix sugerido:** clave compuesta `(payment_id, action)` o `(payment_id, status)`. Migración:
```sql
ALTER TABLE webhook_event DROP CONSTRAINT webhook_event_payment_id_unique;
ALTER TABLE webhook_event ADD CONSTRAINT webhook_event_payment_action_unique
  UNIQUE (payment_id, action);
```

**Estado:** ✅ resuelto — columna `action varchar(64) NOT NULL DEFAULT 'unknown'` añadida al modelo `webhook-event.ts`. Constraint único standalone en `payment_id` eliminado; reemplazado por constraint compuesto `(payment_id, action)`. `WebhookEventService.recordOrSkip` actualizado para incluir `action` en INSERT y usar `onConflictDoNothing()` sin target (respeta el único constraint compuesto). Migración `0008_webhook_event_dedup_key.sql` creada.

---

## 2.8 `webhook_event` crece sin TTL 🟡

**Archivo:** `backend/drizzle/0005_ancient_wendell_vaughn.sql`

**Problema:** tabla sin job de limpieza (a diferencia de `auth_tokens` que sí lo tiene).

**Fix sugerido:** cron nightly que borre `WHERE processed_at < NOW() - INTERVAL '90 days'`.

**Estado:** ✅ resuelto — `cleanupWebhookEventsTick` añadido en `CronService.ts`. Borra filas con `processed_at < NOW() - INTERVAL '90 days'`. Programado a las 03:30 UTC con advisory lock `WEBHOOK_EVENT_CLEANUP_LOCK_KEY` (no colisiona con auth_tokens a las 03:00).

---

## Checklist

- [x] 2.1 Persistir `mp_payment_id` en orders
- [x] 2.2 Manejar webhooks rejected/refunded/cancelled
- [x] 2.3 Cron de reconciliación con MP
- [x] 2.4 Idempotency persistente (Postgres)
- [x] 2.5 Liberar inflight lock con `res.on('finish'|'close')`
- [x] 2.6 MercadoPagoService desde env validado
- [x] 2.7 Dedup key compuesta en webhook_event
- [x] 2.8 TTL cleanup en webhook_event
- [ ] Tests: webhook duplicado, webhook tardío, reconciliación

---

## Bloqueador para habilitar MP en UI

**No habilitar el radio `MERCADO_PAGO` en `checkout.tsx:171` hasta resolver al menos #2.1, #2.2, #2.3 y #2.6.** Hoy está disabled — es la oportunidad de cerrar estos gaps antes de exponer el flujo.
