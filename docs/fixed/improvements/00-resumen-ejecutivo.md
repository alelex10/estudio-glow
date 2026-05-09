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
**Archivo:** `backend/src/routes/webhooks.ts:11-24` · **Doc:** [01-seguridad.md](./01-seguridad.md), [05-diseno-api.md](./05-diseno-api.md)
Cualquiera con la URL del webhook puede dispararlo y marcar órdenes como pagas. Sin verificación de `x-signature` ni deduplicación por `event id`, un atacante puede convertir compras impagas en pagas, o reproducir eventos para inflar métricas. **Es la vulnerabilidad más explotable del backend.**

### 2. JWT_SECRET con fallback hardcoded `"your-secret-key"`
**Archivos:** `backend/src/middleware/auth.ts:8`, `controller/auth.ts:21`, `controller/google.ts:16` · **Doc:** [01-seguridad.md](./01-seguridad.md), [11-devops-deploy.md](./11-devops-deploy.md)
Si la env var no está seteada en producción (cosa que ya pasó en otros proyectos), **cualquiera puede firmar tokens válidos como admin**. Defaults secretos en código son una de las CWEs más recurrentes (CWE-798).

### 3. Tokens JWT filtrados al cliente vía SSR loaders
**Archivos:** `frontend/app/routes/checkout/checkout.tsx:26`, `admin/order/order.tsx:58`, `orders/orders.tsx:37`, `admin/product/product.new.tsx:24`, `admin/category/category.new.tsx:24` · **Doc:** [06-arquitectura-frontend.md](./06-arquitectura-frontend.md)
5 loaders devuelven `{ token }` en el payload SSR. **Esto anula completamente el `httpOnly` de la cookie**: cualquier XSS o extensión maliciosa lee el token desde `window.__remixContext` o el HTML serializado.

### 4. Passwords admin commiteadas en seeds (texto plano)
**Archivo:** `backend/src/seeds/data/user.ts:8-23` · **Doc:** [01-seguridad.md](./01-seguridad.md)
Credenciales reales con rol `admin`:
- `yasitacardenas3637@gmail.com / estudioglow@423`
- `elvizvida@gmail.com / User@1234`
**Asumir comprometidas. Rotar inmediatamente y purgar el historial git** si esos usuarios existen en producción.

### 5. Dockerfile de "producción" corre `bun run dev` (watch mode)
**Archivo:** `backend/Dockerfile:20` · **Doc:** [11-devops-deploy.md](./11-devops-deploy.md)
El contenedor "productivo" arranca con watcher activo: reinicios espurios, alto consumo de CPU, comportamiento no determinístico. Combinado con `NODE_ENV` mal seteado, deshabilita además optimizaciones de Express.

### 6. CORS abierto a todo origen en development con `credentials: true`
**Archivo:** `backend/src/index.ts:42-46` · **Doc:** [01-seguridad.md](./01-seguridad.md)
`if (isDevelopment) return callback(null, true)`. Si `NODE_ENV=development` se cuela en deploy (común), **CSRF total cross-origin con cookies habilitadas**.

### 7. Cero tests en todo el repo
**Doc:** [07-testing.md](./07-testing.md)
Ni unit, ni integración, ni e2e. **El flujo de pago (checkout, MP, webhooks) no tiene un solo test** — riesgo financiero directo. Cualquier refactor es una ruleta rusa.

### 8. README miente: "arquitectura de caché de dos niveles" no existe
**Doc:** [09-performance-cache.md](./09-performance-cache.md), [12-documentacion.md](./12-documentacion.md)
El README enlaza a `docs/architecture/arquitectura-cache.md` que **no existe**. Ninguna ruta exporta `headers()` con Cache-Control. La feature no está implementada.

---

## ⚠️ Problemas de severidad ALTA

| # | Problema | Doc |
|---|----------|-----|
| 9 | `/dashboard/stats` sin `requireAdmin` — cualquier customer logueado lee stock e inventario | [02-auth-authorization.md](./02-auth-authorization.md) |
| 10 | Account takeover vía linking automático Google ↔ Local sin confirmación | [02-auth-authorization.md](./02-auth-authorization.md) |
| 11 | Sin helmet, sin rate-limit, sin CSRF protection | [01-seguridad.md](./01-seguridad.md) |
| 12 | `cart.user_id` no es `unique` ni `notNull` → carritos duplicados por race | [04-base-de-datos.md](./04-base-de-datos.md) |
| 13 | Cero índices en FKs y columnas filtradas (`order.user_id`, `expires_at`, etc.) | [04-base-de-datos.md](./04-base-de-datos.md) |
| 14 | Convención de dinero indefinida: SQL `integer`, Zod ejemplo `1500.99` (decimales) | [04-base-de-datos.md](./04-base-de-datos.md) |
| 15 | Cron in-process — duplicará trabajo si Render escala a 2 instancias | [09-performance-cache.md](./09-performance-cache.md) |
| 16 | Sin `Idempotency-Key` en checkout — doble click crea órdenes duplicadas | [05-diseno-api.md](./05-diseno-api.md) |
| 17 | OpenAPI cubre ~40% de rutas (faltan cart, orders, checkout, webhooks, users, favorites) | [05-diseno-api.md](./05-diseno-api.md), [12-documentacion.md](./12-documentacion.md) |
| 18 | Sin capa de Repositorio — controllers hablan directo a Drizzle, lógica de negocio en handlers | [03-arquitectura-backend.md](./03-arquitectura-backend.md) |
| 19 | Tipos frontend desincronizados con Zod backend (`description`, `imageUrl`, `category` divergen en `nullable`) | [08-type-safety-shared.md](./08-type-safety-shared.md) |
| 20 | Producción ciega: 37 `console.log`, sin Sentry, sin métricas, sin `/health` | [10-observabilidad.md](./10-observabilidad.md) |
| 21 | Sin `.env.example`, sin CI (`.github/workflows/`), lockfiles duplicados | [11-devops-deploy.md](./11-devops-deploy.md) |
| 22 | Postgres pool sin configurar (`max`, `idle_timeout`, `statement_timeout`) | [09-performance-cache.md](./09-performance-cache.md) |
| 23 | Drawer/Popover/Toast propios sin focus-trap, sin `aria-modal`, sin escape (a11y rota) | [06-arquitectura-frontend.md](./06-arquitectura-frontend.md) |

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
