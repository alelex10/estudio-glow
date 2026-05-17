# 04 — Arquitectura / Tests

> **ESTADO ACTUAL (2026-05-17):** ✅ Issues 4.1–4.3, 4.6, 4.7, 4.10 **RESUELTOS**. Pendientes: 4.4 (casts residuales), 4.5 (logging parcial), 4.8–4.9 (tests).

**Prioridad:** P2 — no rompe nada hoy pero deja deuda técnica que aparecerá.
**Áreas:** controllers, repositories, services, logging, tests.

---

## 4.1 Lógica de negocio en `controller/google.ts` 🟠

**Archivo:** `backend/src/controller/google.ts:128-271`

**Problema:** `resolveGoogleIdentity` hace 5 queries directas a `users` (lookup x2, update, INSERT, SELECT por id) desde el controller. INSERT + SELECT no están dentro de una transacción.

**Impacto:**
- Si entre el INSERT y el SELECT falla la conexión, hay un user huérfano sin token emitido.
- Patrón inconsistente: el resto del proyecto usa repos.

**Fix sugerido:**
1. Mover a `AuthService.resolveGoogleIdentity()`.
2. Agregar `UserRepository.create()`, `UserRepository.linkGoogle()`, `UserRepository.markVerified()`.
3. Envolver el flujo en `db.transaction`.
4. Usar `INSERT ... RETURNING *` en vez de INSERT + SELECT.

**Estado:** ✅ resuelto — `resolveGoogleIdentity` movida a `AuthService.ts` como `resolveGoogleIdentity(payload)`. El flujo completo se envuelve en `db.transaction`. El controller (`google.ts`) ahora solo llama `AuthService.resolveGoogleIdentity` y traduce el resultado a HTTP via switch discriminado. Se eliminaron los imports directos de `db`, `users`, `eq`, `randomUUID` del controller.

---

## 4.2 `UserRepository` incompleto 🟡

**Archivo:** `backend/src/repositories/UserRepository.ts`

**Problema:** se extrajeron `findById`/`findByEmail`/`findPublicById` pero `create`/`update`/`linkGoogle` siguen como `db.insert(users)` inline en controllers. Refactor a medias.

**Fix sugerido:** completar las write operations en el repo y migrar callers.

**Estado:** ✅ resuelto — agregados `create(data, tx?)`, `update(id, data, tx?)`, `linkGoogle(userId, googleId, tx?)`, `markVerified(userId, tx?)` y `findByGoogleId(googleId, tx?)`. Todos aceptan `tx` opcional con el mismo patrón de `OrderRepository`. `linkGoogle` también setea `password_hash = null` (Fix 5.5).

---

## 4.3 `ProductRepository` viola SRP haciendo lookup de categoría 🟡

**Archivo:** `backend/src/repositories/ProductRepository.ts:88-132`

**Problema:** un repo de productos consulta `categories` para resolver nombre → ID. Encima genera una query extra antes de la principal.

**Fix sugerido:**
- Opción A: `INNER JOIN categories ON ... WHERE categories.name ILIKE $1` en una sola query.
- Opción B: resolver `categoryId` en el service antes de llamar al repo.

**Estado:** ✅ resuelto — `buildFilters` convertido de `async` (con pre-query a `categories`) a síncrono; emite `ilike(categories.name, ...)` aprovechando el `leftJoin` ya presente en `buildJoinedSelect`. `countFiltered` actualizado para incluir el join. Eliminado el fallback `"no-match"` artificial.

---

## 4.4 Casts `as typeof query` y `as any` rompen el tipado de Drizzle 🟡

**Archivos:**
- `backend/src/repositories/OrderRepository.ts:82-86, 95-99` (ver también #1.4)
- `backend/src/repositories/OrderRepository.ts:173-184` — `tx as unknown as typeof db`
- `backend/src/repositories/ProductRepository.ts:213-215` — `(query as any).where(...)`
- `backend/src/services/OrderService.ts:67, 92, 123, 143` — `tx as unknown as typeof db`

**Problema:** desactivan el chequeo de Drizzle que prohíbe usos inválidos. Funcionan por duck typing pero pierden garantías de compile time.

**Fix sugerido:**
- Para `tx`: tipar como `PgDatabase<...> | PgTransaction<...>` o el genérico `DrizzleClient` correcto.
- Para filtros: ver fix de #1.4 (patrón `conditions[]` + `and(...)`).

**Estado:** ⬜ pendiente

---

## 4.5 Logging inconsistente: `console.*` vs `logger` pino 🟠

**Archivos:**
- `backend/src/middleware/error-handler.ts:32-57` — `console.error` con `cause` que puede incluir PII de PG (`detail`, `table`, `column`, `constraint`).
- `backend/src/services/WebhookEventService.ts:24-28` — `console.warn`.

**Problema:**
- Escapa la redacción de PII configurada en pino (`lib/logger.ts:9-20`).
- No se correlaciona con `x-request-id`.
- No es parseable por logs agregadores en producción.
- `cause.detail` de Postgres puede contener valores reales del row: `"Key (email)=(user@example.com) already exists"`.

**Fix sugerido:** usar `req.log.error(...)` o `logger.error(...)` consistentemente. En prod, redactar `cause.detail` o solo loguear `code` + `constraint_name`.

**Estado:** ✅ resuelto — `error-handler.ts` migrado a `logger.error(...)` de pino. `cause` sanitizado: solo se loguea `code` + `constraint_name`; se elimina `detail`/`table`/`column`/`hint` que podían contener PII. Correlación vía `req.id` (pino-http). WebhookEventService queda pendiente (otro agente).

---

## 4.6 Migration 0006: rollback destructivo + falta rollback para 0005 🟡

**Archivos:**
- `backend/drizzle/0006_rollback.sql` — `DROP COLUMN email_verified` pierde info irrecuperable.
- `backend/drizzle/0005_*.sql` — sin archivo rollback (asimetría con 0006).

**Problema adicional:** el `UPDATE user SET email_verified=true` en 0006 hace full-scan + WAL proporcional al tamaño de la tabla. En tabla chica (<100k) OK; en tabla grande conviene batched UPDATE.

**Fix sugerido:**
- Crear `0005_rollback.sql` por simetría.
- Agregar comentario `-- REQUIRES BACKUP` al inicio de `0006_rollback.sql`.
- Documentar que el `_journal.json` no se actualiza automáticamente al rollback manual.

**Estado:** ✅ resuelto — creado `backend/drizzle/0005_rollback.sql` (DROP TABLE webhook_event con advertencia de backup). Agregado bloque de advertencias al inicio de `0006_rollback.sql` (backup requerido, batched UPDATE, nota sobre _journal.json).

---

## 4.7 `db.ts` con `prepare: false` siempre 🟡

**Archivo:** `backend/src/db.ts:9`

**Problema:** aceptable para Supabase pooler, pero si `DATABASE_URL` apunta a Postgres directa, perdés perf de prepared statements.

**Fix sugerido:** detectar automáticamente o leer de env `PG_PREPARE`. Default `false` si la URL contiene `pooler.supabase.com`.

**Estado:** ✅ resuelto — `db.ts` auto-detecta: `prepare: false` si `DATABASE_URL` contiene `pooler.supabase.com`, `prepare: true` para conexión directa a Postgres.

---

## 4.8 Tests: cobertura crítica inexistente 🔴

**Único test:** `backend/src/middleware/csrf.test.ts`.

**Faltan tests para los archivos donde un bug = pérdida de plata:**

| Archivo | Caso a testear |
|---------|----------------|
| `AuthTokenService.consume` | Doble click / carrera atómica |
| `OrderService.createOrder` | Stock=1 con 2 promesas paralelas (oversell) |
| `OrderService.markOrderPaid` | Sobre orden ya `EXPIRED` (debe no-op + log) |
| `WebhookEventService.recordOrSkip` | Duplicado con mismo `payment_id` |
| `verifyMpWebhook` | HMAC válido / inválido / clock skew |
| `idempotency` | Misma key concurrente / TTL / inflight cleanup |
| `CronService.expireOrdersTick` | No pisar órdenes PAID (ver #1.2) |

**Fix sugerido:**
1. Configurar `vitest` con Postgres real (testcontainers) o `pg-mem` para tests integración.
2. Empezar por los 3 más críticos: `createOrder` concurrencia, `markOrderPaid` con guard, `recordOrSkip` dedup.

**Estado:** ⬜ pendiente

---

## 4.9 `vitest.config.ts` no se ejerce 🟡

**Archivo:** `backend/vitest.config.ts`

**Problema:** include `src/**/*.test.ts` está bien, pero solo existe 1 archivo de test.

**Estado:** ⬜ pendiente (resuelto al avanzar #4.8)

---

## 4.10 OpenAPI sync no validado en CI 🟡

**Archivos:** `backend/scripts/dump-openapi.ts`, `backend/openapi.json`, `frontend/app/common/types/api.gen.ts`

**Problema:** scripts existen pero nada garantiza que `openapi.json` esté al día con el código. Si alguien cambia una ruta y no regenera, el frontend usa types stale.

**Fix sugerido:** pre-commit hook o CI step:
```bash
cd backend && bun openapi:dump
cd frontend && bun gen:types
git diff --exit-code  # falla si hay drift
```

**Estado:** ✅ resuelto — creado `backend/scripts/check-openapi-sync.sh` (executable). Agrega script `openapi:check` a `backend/package.json`. El script es defensivo: omite el paso `gen:types` si `api.gen.ts` no existe (fix 3.3 opción-b). Puede enlazarse como pre-commit hook (`.git/hooks/pre-commit`) o step de CI.

---

## Checklist

- [x] 4.1 Mover `resolveGoogleIdentity` a AuthService + transacción
- [x] 4.2 Completar UserRepository con create/update/linkGoogle
- [x] 4.3 ProductRepository: join directo en vez de pre-lookup de categoría
- [ ] 4.4 Eliminar `as any` / `as typeof query` con patrón `conditions[]`
- [x] 4.5 Migrar `console.*` → `logger` con redacción de PII
- [x] 4.6 Crear rollback de 0005 + warning de backup en 0006
- [x] 4.7 `prepare` configurable en db.ts
- [ ] 4.8 Tests para flujos financieros (mínimo 3: createOrder, markOrderPaid, recordOrSkip)
- [x] 4.10 Pre-commit / CI que valide OpenAPI sync
