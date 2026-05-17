# 0. Resumen Ejecutivo — Auditoría Estudio-Glow

> Auditoría exhaustiva del proyecto **estudio-glow** (e-commerce con Bun + Express 5 + Drizzle + Postgres en backend, y React Router 7 SSR + React 19 + Tailwind v4 en frontend).
> Fecha: 2026-05-09. Cubre 12 dominios técnicos. Cada dominio tiene su propio archivo `.md` con análisis detallado, evidencia (`archivo:línea`) y recomendaciones priorizadas.

---

## Índice de documentos

| # | Documento | Dominio |
|---|-----------|---------|
| 01 | [Seguridad](./01-seguridad.md) | CORS, JWT, cookies, file uploads, webhooks, rate limiting |
| 02 | [Auth & Authorization](./02-auth-authorization.md) | RBAC, Google OAuth, account linking, password policy |
| 03 | [Arquitectura Backend](./03-arquitectura-backend.md) | Capas, repositorios, services, errores, DI |
| 04 | [Base de Datos](./04-base-de-datos.md) | Esquema, índices, transacciones, migraciones, seeds |
| 05 | [Diseño de API](./05-diseno-api.md) | REST, paginación, versionado, envelope, OpenAPI, idempotencia |
| 06 | [Arquitectura Frontend](./06-arquitectura-frontend.md) | SSR, container/presentational, services, contexts, a11y |
| 07 | [Testing](./07-testing.md) | Estrategia unit/component/e2e (proyecto sin tests) |
| 08 | [Type Safety Compartido](./08-type-safety-shared.md) | Sincronización tipos front-back, OpenAPI codegen |
| 09 | [Performance & Cache](./09-performance-cache.md) | SSR caching, imágenes, bundle, pool DB, compresión |
| 10 | [Observabilidad](./10-observabilidad.md) | Logging estructurado, error tracking, métricas, healthcheck |
| 11 | [DevOps & Deploy](./11-devops-deploy.md) | Docker, CI/CD, secrets, .env.example, migraciones |
| 12 | [Documentación](./12-documentacion.md) | README, OpenAPI, ADRs, onboarding |

---

## 🔥 Problemas CRÍTICOS (resolver YA)

Estos son bloqueantes de producción. Cada uno tiene capacidad de comprometer dinero, datos o cuentas.

### 1. Webhook MercadoPago sin validación HMAC

> ✅ **RESUELTO 2026-05-15** — Middleware HMAC SHA-256 con clock-skew ±300s + tabla `webhook_event` con UNIQUE para idempotencia. Ver archive-report en engram `sdd/webhook-mp-hmac/archive-report`.

**Archivo:** `backend/src/routes/webhooks.ts:11-24` · **Doc:** [01-seguridad.md](./01-seguridad.md), [05-diseno-api.md](./05-diseno-api.md)
Cualquiera con la URL del webhook puede dispararlo y marcar órdenes como pagas. Sin verificación de `x-signature` ni deduplicación por `event id`, un atacante puede convertir compras impagas en pagas, o reproducir eventos para inflar métricas. **Es la vulnerabilidad más explotable del backend.**

### 2. JWT_SECRET con fallback hardcoded `"your-secret-key"`

> ✅ **RESUELTO 2026-05-15** — Ver [docs/fixed/resolved/01-seguridad.md](../resolved/01-seguridad.md) para el detalle del fix.

**Archivos:** `backend/src/middleware/auth.ts:8`, `controller/auth.ts:21`, `controller/google.ts:16` · **Doc:** [01-seguridad.md](./01-seguridad.md), [11-devops-deploy.md](./11-devops-deploy.md)
Si la env var no está seteada en producción (cosa que ya pasó en otros proyectos), **cualquiera puede firmar tokens válidos como admin**. Defaults secretos en código son una de las CWEs más recurrentes (CWE-798).

### 3. Tokens JWT filtrados al cliente vía SSR loaders

> ✅ **RESUELTO 2026-05-15 (leak cliente)** — `routes/layout.tsx` ya no devuelve `token`; `FavoritesContext` ya no acepta `token` prop y usa cookie httpOnly vía `credentials:include`. El `token` en el JSON body del backend queda como follow-up defense-in-depth (esa ruta sólo es consumida server-side por Remix actions, no es un leak directo).

**Archivos:** `frontend/app/routes/checkout/checkout.tsx:26`, `admin/order/order.tsx:58`, `orders/orders.tsx:37`, `admin/product/product.new.tsx:24`, `admin/category/category.new.tsx:24` · **Doc:** [06-arquitectura-frontend.md](./06-arquitectura-frontend.md)
5 loaders devuelven `{ token }` en el payload SSR. **Esto anula completamente el `httpOnly` de la cookie**: cualquier XSS o extensión maliciosa lee el token desde `window.__remixContext` o el HTML serializado.

### 4. Passwords admin commiteadas en seeds (texto plano)

> ✅ **RESUELTO 2026-05-15** — Ver [docs/fixed/resolved/01-seguridad.md](../resolved/01-seguridad.md) para el detalle del fix.

**Archivo:** `backend/src/seeds/data/user.ts:8-23` · **Doc:** [01-seguridad.md](./01-seguridad.md)
Credenciales reales con rol `admin`:
- `yasitacardenas3637@gmail.com / estudioglow@423`
- `elvizvida@gmail.com / User@1234`
**Asumir comprometidas. Rotar inmediatamente y purgar el historial git** si esos usuarios existen en producción.

### 5. Dockerfile de "producción" corre `bun run dev` (watch mode)

> ✅ **RESUELTO 2026-05-15** — Ver [docs/fixed/resolved/11-devops-deploy.md](../resolved/11-devops-deploy.md) para el detalle del fix.

**Archivo:** `backend/Dockerfile:20` · **Doc:** [11-devops-deploy.md](./11-devops-deploy.md)
El contenedor "productivo" arranca con watcher activo: reinicios espurios, alto consumo de CPU, comportamiento no determinístico. Combinado con `NODE_ENV` mal seteado, deshabilita además optimizaciones de Express.

### 6. CORS abierto a todo origen en development con `credentials: true`

> ✅ **RESUELTO 2026-05-15** — Ver [docs/fixed/resolved/01-seguridad.md](../resolved/01-seguridad.md) para el detalle del fix.

**Archivo:** `backend/src/index.ts:42-46` · **Doc:** [01-seguridad.md](./01-seguridad.md)
`if (isDevelopment) return callback(null, true)`. Si `NODE_ENV=development` se cuela en deploy (común), **CSRF total cross-origin con cookies habilitadas**.

### 7. Cero tests en todo el repo

> 🟡 **SCAFFOLDING 2026-05-15** — Vitest configurado en backend (`vitest.config.ts`, scripts `test`/`test:watch`/`test:coverage`). Primer test del middleware CSRF pasa. Falta cobertura real de webhook HMAC, checkout, OrderService.

**Doc:** [07-testing.md](./07-testing.md)
Ni unit, ni integración, ni e2e. **El flujo de pago (checkout, MP, webhooks) no tiene un solo test** — riesgo financiero directo. Cualquier refactor es una ruleta rusa.

### 8. README miente: "arquitectura de caché de dos niveles" no existe

> ✅ **RESUELTO 2026-05-15** — Ver [docs/fixed/resolved/12-documentacion.md](../resolved/12-documentacion.md) para el detalle del fix.

**Doc:** [09-performance-cache.md](./09-performance-cache.md), [12-documentacion.md](./12-documentacion.md)
El README enlaza a `docs/architecture/arquitectura-cache.md` que **no existe**. Ninguna ruta exporta `headers()` con Cache-Control. La feature no está implementada.

---

## ⚠️ Problemas de severidad ALTA

| # | Problema | Doc |
|---|----------|-----|
| ✅ 9 | `/dashboard/stats` sin `requireAdmin` — cualquier customer logueado lee stock e inventario | [02-auth-authorization.md](./02-auth-authorization.md) |
| ✅ 10 | Account takeover vía linking automático Google ↔ Local sin confirmación — RESUELTO 2026-05-15: linking automático eliminado, throw ConflictError | [02-auth-authorization.md](./02-auth-authorization.md) |
| ✅ 11 | Sin helmet, sin rate-limit, sin CSRF protection — RESUELTO 2026-05-15: helmet + express-rate-limit + custom-header CSRF | [01-seguridad.md](./01-seguridad.md) |
| ✅ 12 | `cart.user_id` no es `unique` ni `notNull` → carritos duplicados por race | [04-base-de-datos.md](./04-base-de-datos.md) |
| ✅ 13 | Cero índices en FKs y columnas filtradas (`order.user_id`, `expires_at`, etc.) | [04-base-de-datos.md](./04-base-de-datos.md) |
| ✅ 14 | Convención de dinero indefinida: SQL `integer`, Zod ejemplo `1500.99` (decimales) — RESUELTO 2026-05-15: integer ARS en Zod, examples sin decimales | [04-base-de-datos.md](./04-base-de-datos.md) |
| ✅ 15 | Cron in-process — duplicará trabajo si Render escala a 2 instancias — RESUELTO 2026-05-15: pg_try_advisory_lock | [09-performance-cache.md](./09-performance-cache.md) |
| ✅ 16 | Sin `Idempotency-Key` en checkout — RESUELTO 2026-05-15: middleware idempotency in-memory + frontend manda header | [05-diseno-api.md](./05-diseno-api.md) |
| ✅ 17 | OpenAPI cubre ~40% de rutas — RESUELTO 2026-05-15: 18 paths nuevos en cart/orders/checkout/webhooks/users/favorites | [05-diseno-api.md](./05-diseno-api.md), [12-documentacion.md](./12-documentacion.md) |
| 🟡 18 | Sin capa de Repositorio — RESUELTO PARCIAL 2026-05-15: `ProductRepository` / `OrderRepository` / `UserRepository` extraídos; `controller/product.ts` -188 LOC, `OrderService` -126 LOC. Follow-up: cart/category/favorite/auth/google/dashboard | [03-arquitectura-backend.md](./03-arquitectura-backend.md) |
| ✅ 19 | Tipos frontend desincronizados — RESUELTO 2026-05-15: `openapi-typescript` codegen (`backend/openapi.json` → `frontend/app/common/types/api.gen.ts`); `Product` alineado con backend (description/imageUrl nullable + category nested) | [08-type-safety-shared.md](./08-type-safety-shared.md) |
| ✅ 20 | Producción ciega — RESUELTO 2026-05-15: pino + pino-http con redact, /health/live + /health/ready, X-Request-Id propagation | [10-observabilidad.md](./10-observabilidad.md) |
| ✅ 21 | Sin `.env.example`, sin CI — RESUELTO 2026-05-15: `.github/workflows/ci.yml` (typecheck + tests para front y back) | [11-devops-deploy.md](./11-devops-deploy.md) |
| ✅ 22 | Postgres pool sin configurar — RESUELTO 2026-05-15: max/idle_timeout/max_lifetime/connect_timeout/statement_timeout vía env | [09-performance-cache.md](./09-performance-cache.md) |
| ✅ 23 | Drawer/Popover/Toast propios sin focus-trap, sin `aria-modal`, sin escape — RESUELTO 2026-05-15: focus-trap + aria-modal + Escape + body-scroll-lock en Drawer; aria-haspopup/expanded + click-outside en Popover; role=alert/status + aria-live en Toast | [06-arquitectura-frontend.md](./06-arquitectura-frontend.md) |

---

## 📊 Hallazgos Positivos (lo que está bien hecho)

No todo es crítica — el proyecto tiene cimientos sólidos en varias áreas:

- ✅ **Drizzle parametriza correctamente.** No hay raw SQL con input de usuario → SQL injection prácticamente imposible.
- ✅ **`google-auth-library` valida `iss/aud/exp/firma`** del idToken correctamente.
- ✅ **Ownership chequeada** en `getUserOrderById` (no se filtran órdenes de otros usuarios).
- ✅ **Cloudinary con `f_auto,q_auto`** + Sharp resize a 1200px → optimización de imágenes correcta.
- ✅ **`/products`, `/categories`, `/orders` admin** sí tienen `requireAdmin` aplicado consistentemente (excepto `/dashboard`).
- ✅ **Sharp + magic bytes parciales** en upload de productos (mitiga MIME spoofing).
- ✅ **Zod + react-hook-form** vía `zodResolver` consistente en formularios del frontend.
- ✅ **Boundary `*.server.ts`** se usa correctamente en `auth.server.ts` / `authApi.server.ts`.

---

## 🗺️ Plan de Acción Recomendado

### Sprint 1 — Stop the bleeding (1 semana)
Resolver los **8 problemas críticos**. Sin esto el sistema está expuesto.
1. Validar firma HMAC en webhook MP + idempotencia por `event id`.
2. Eliminar fallbacks `JWT_SECRET || "your-secret-key"` y validar env al boot.
3. Quitar `token` de TODOS los loaders (volver a usar la cookie `httpOnly` desde el server).
4. Rotar passwords admin del seed y migrar a env vars; limpiar historial git.
5. Arreglar Dockerfile de backend (`bun start` con `NODE_ENV=production`).
6. Reemplazar wildcard CORS de development por whitelist explícita siempre.
7. Activar primer test crítico: e2e de checkout con MP en sandbox.
8. Crear `docs/architecture/arquitectura-cache.md` o remover el link del README.

### Sprint 2 — Fundamentos (2 semanas)
Resolver severidades altas (9-23).
- Agregar `requireAdmin` faltante, helmet, rate-limit, CSRF.
- Índices en FKs + transacciones en checkout.
- `.env.example`, CI básico (typecheck + lint), Sentry, structured logging.
- Refactor: extraer Repository, mover lógica fuera de controllers.
- Setup de Vitest + 1 test por capa crítica.

### Sprint 3 — Calidad sostenible (3-4 semanas)
- OpenAPI codegen → `openapi-typescript` consumido en frontend (elimina divergencia de tipos).
- Cobertura de tests > 60% en módulos críticos (auth, checkout, webhooks).
- Migrar Drawer/Popover/Toast propios a Radix (a11y gratis).
- Cron a worker dedicado fuera del proceso web.
- ADRs documentando decisiones grandes (JWT, MP, MercadoPago vs Stripe).
- Tailwind v4 tokens consolidados, code-splitting de admin.

---

## 📐 Métricas de éxito

| Métrica | Estado actual | Objetivo Sprint 3 |
|---------|---------------|-------------------|
| Cobertura tests | 0% | > 60% módulos críticos |
| Endpoints OpenAPI documentados | ~40% | 100% |
| TS strict en frontend (`noUncheckedIndexedAccess`) | ❌ | ✅ |
| Tipos compartidos front-back | duplicados | OpenAPI codegen |
| Error tracking en prod | console.log | Sentry + structured logs |
| Tiempo de boot Docker (backend) | watcher activo | < 5s prod |
| Healthcheck endpoint | no existe | `/health` con DB check |
| Migraciones automatizadas en deploy | manual | CI/CD |

---

## Archivos generados por esta auditoría

```
docs/improvements/
├── 00-resumen-ejecutivo.md          ← este archivo
├── 01-seguridad.md
├── 02-auth-authorization.md
├── 03-arquitectura-backend.md
├── 04-base-de-datos.md
├── 05-diseno-api.md
├── 06-arquitectura-frontend.md
├── 07-testing.md
├── 08-type-safety-shared.md
├── 09-performance-cache.md
├── 10-observabilidad.md
├── 11-devops-deploy.md
└── 12-documentacion.md
```

Cada archivo sigue el formato:
- `## Estado actual` (con referencias `archivo:línea`)
- `## Problemas detectados` (numerados, con severidad, evidencia, impacto)
- `## Recomendaciones` (priorizadas, con snippets cuando ayudan)
- `## Referencias` (links a OWASP, MDN, docs oficiales)
