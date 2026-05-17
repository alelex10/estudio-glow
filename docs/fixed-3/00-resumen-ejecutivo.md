# Resumen Ejecutivo — Code Review de cambios locales

**Fecha:** 2026-05-16
**Método:** code review estático sobre cambios sin commitear (52 archivos modificados + ~30 nuevos · +1571/-958 LOC).
**Subagentes:** 4 en paralelo (seguridad, arquitectura backend, frontend, flujos cross-cutting).
**Alcance:** todos los cambios locales pendientes de commit.

---

## Informes detallados

| # | Área | Archivo |
|---|------|---------|
| 1 | Bugs operacionales (checkout / órdenes) | [01-bugs-operacionales.md](./01-bugs-operacionales.md) |
| 2 | Pagos y MercadoPago | [02-pagos-mercadopago.md](./02-pagos-mercadopago.md) |
| 3 | Frontend / UX | [03-frontend-ux.md](./03-frontend-ux.md) |
| 4 | Arquitectura / Tests | [04-arquitectura-tests.md](./04-arquitectura-tests.md) |
| 5 | Seguridad (prioridad baja para esta web) | [05-seguridad.md](./05-seguridad.md) |

---

## Veredicto general

El refactor introduce **infraestructura sólida** (auth tokens atómicos, HMAC en webhooks, idempotencia DB, pino con redacción de PII, advisory locks en cron) pero quedan **bugs operacionales reales que se disparan en uso normal sin necesidad de atacante**. Tres de ellos pueden corromper estado de órdenes y stock.

El gap entre lo que el backend ofrece y lo que el frontend consume sigue siendo significativo (CSRF token, `api.gen.ts` sin usar).

---

## Bloqueadores que pueden romper en producción

Ordenados por probabilidad de que ocurran en uso normal:

### 1. Race condition de stock en checkout
`OrderService.createOrder` hace SELECT + UPDATE sin `FOR UPDATE`. Dos clientes legítimos comprando al mismo tiempo con stock=1 → ambos crean orden, stock queda negativo.

### 2. Cron pisa órdenes pagadas
`CronService.expireOrdersTick` fuerza UPDATE a `EXPIRED` después de llamar `cancelOrder`, sin atomicidad. Una orden que justo se pagó cuando vence puede quedar marcada `EXPIRED` aunque el webhook ya la marcó `PAID`.

### 3. Webhook tardío sobreescribe estado terminal
`markOrderPaid` no valida que la orden esté `PENDING`. Si llega un webhook tarde sobre una orden ya `EXPIRED` (stock ya restituido), pasa a `PAID` sin volver a descontar stock. Cliente paga y no hay producto.

### 4. Filtros AND silenciosamente rotos en órdenes
`OrderRepository` con el patrón `query = query.where(...) as typeof query` reemplaza el filtro previo en vez de combinarlos. `GET /orders?status=PAID&paymentMethod=TRANSFER` ignora uno de los dos filtros.

### 5. Webhooks no-approved se descartan
`webhooks.ts:34` solo procesa `payment.status === "approved"`. Reembolsos, rechazos y contracargos no hacen nada. Sin reconciliación si MP nunca manda webhook.

### 6. Submit nativo rompe RR v7 en login/register
`handleSubmit((_, e) => e.target.submit())` hace full-page reload, perdiendo spinner y `actionData`.

### 7. `payment_id` de MP no se persiste en `orders`
Sin trazabilidad para reembolsos / soporte / auditoría.

### 8. Idempotency in-memory
Funciona con 1 instancia. Reinicio durante un retry → doble orden.

---

## Patrones sistémicos

### A. Tipos generados pero no consumidos
`frontend/app/common/types/api.gen.ts` (2725 líneas) generado por `openapi-typescript` pero el frontend mantiene tipos manuales paralelos en `response.ts`, `user-types.ts`, `product-types.ts`. Drift garantizado.

### B. Lógica de negocio en controllers
`controller/google.ts` hace 5 queries directas a `users` + INSERT sin transacción. Debería delegar a `AuthService` + `UserRepository`.

### C. Logging inconsistente
Coexisten `console.error` (`error-handler.ts`, `WebhookEventService`) y `logger` pino (con redacción de PII). El primer set escapa la redacción y no se correlaciona con `request_id`.

### D. `process.env` directo bypaseando Zod
`MercadoPagoService.ts:5,11` usa `process.env.MP_ACCESS_TOKEN` con default `"APP_USR-testing_token"`. Si falta la env en prod, MP arranca con token fake silenciosamente.

---

## Lo que está bien (no tocar)

- `AuthTokenService.consume` con `UPDATE ... WHERE used_at IS NULL AND expires_at > now() RETURNING` — atomicidad correcta.
- Tokens hasheados SHA-256, link solo con `?token=`, sin email.
- HMAC de webhooks MP: `timingSafeEqual`, clock-skew 300s, fail-closed, `express.raw()` antes de `express.json()`.
- Advisory locks en cron.
- `WebhookEventService.recordOrSkip` con `ON CONFLICT DO NOTHING + RETURNING`.
- Health probes split `/live` vs `/ready`.
- Drawer con focus trap + a11y correcta.
- Anti-enumeración en `resend-verification` y `check-email`.
- Pino con redacción de PII.

---

## Plan de fix sugerido

| Prioridad | Cuándo | Items |
|-----------|--------|-------|
| **P0** | Esta semana | #1, #2, #3, #4 (bugs que pasan en uso normal) |
| **P1** | Antes de habilitar MP en UI | #5, #7, #8 + tests de concurrencia |
| **P2** | Cuando se toquen esos archivos | #6, frontend cleanup, refactor controllers |
| **P3** | Backlog | Seguridad endurecida (ver `05-seguridad.md`) |
