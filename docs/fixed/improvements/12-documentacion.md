# 12. Documentación

Auditoría de READMEs, OpenAPI, ADRs, onboarding y CONTRIBUTING.

## Estado actual

- **README raíz** (`README.md`, 38 líneas): menciona `npm install` pero el proyecto usa Bun.
- **Backend README** (`backend/README.md`, 15 líneas): boilerplate de `bun init`. Dice `bun run index.ts` pero el entry real es `bun src/index.ts`. **Engañoso y vacío**.
- **Frontend README** (`frontend/README.md`, 87 líneas): boilerplate de `create-react-router`. Habla de Docker generic, no menciona Vercel ni cómo está deployado, ni env vars necesarias.
- **OpenAPI**: `backend/src/docs/openapi.ts:5-8` registra solo `auth`, `products`, `categories`, `dashboard`. **No documenta**: `cart`, `checkout`, `orders`, `favorites`, `users`, `webhooks`, `public`. Existen rutas reales en `backend/src/routes/` para todas esas. La doc cubre ~40% de la superficie.
- **ADRs**: NO EXISTE `docs/adr/`. Decisiones grandes (JWT vs sessions, MercadoPago vs Stripe, Drizzle vs Prisma, React Router 7 vs Next, Bun vs Node, Cloudinary vs S3) sin trazabilidad.
- **Onboarding**: ningún doc paso-a-paso para "cómo correr el proyecto local". Los READMEs no mencionan que necesitás Postgres corriendo, ni cómo crear la DB, ni que las migrations se corren con `bun run migrate`.
- **CONTRIBUTING.md / CODEOWNERS**: ausentes.
- **Comentarios en código**: en general buenos en lugares clave (ej. `backend/src/middleware/optimize.ts:4-13` explica el "por qué" de no convertir a WebP server-side; `backend/src/db.ts:8` comenta sobre prefetch). Esto es lo MEJOR del proyecto en docs.

## Problemas detectados

### 1. Backend README inútil — ALTO

**Evidencia**: `backend/README.md` es el template de `bun init`. Dice `bun run index.ts` (mal), no menciona env vars, Postgres, migrations, Cloudinary, MP, Google OAuth, ni cómo arrancar.

**Impacto**: nuevo dev no puede levantar el backend sin leer todo el código.

### 2. Frontend README es boilerplate genérico — ALTO

**Evidencia**: `frontend/README.md` viene de `create-react-router`. No menciona Vercel (a pesar de `react-router.config.ts:9` usar `vercelPreset`), ni que el backend está en Render, ni `API_BASE_URL`/`SESSION_SECRET`.

**Impacto**: idem.

### 3. OpenAPI cubre ~40% de las rutas — ALTO

**Evidencia**: `backend/src/routes/` tiene 11 routers; `backend/src/docs/openapi.ts:5-8` solo importa 4. Rutas no documentadas: `cart`, `checkout`, `orders`, `favorites`, `users`, `webhooks`, `public`. Frontend (y futuros consumidores) no tiene contrato claro.

**Impacto**: integraciones se hacen leyendo controladores. Cambios en endpoints rompen consumidores sin warning. El swagger UI en `/api-docs` da una falsa sensación de cobertura.

### 4. Sin ADRs — MEDIO

**Evidencia**: ausencia de `docs/adr/`. Decisiones críticas sin contexto:
- ¿Por qué JWT en cookies en vez de sessions server-side?
- ¿Por qué MercadoPago y no Stripe?
- ¿Por qué Drizzle y no Prisma?
- ¿Por qué Bun en lugar de Node?
- ¿Por qué React Router 7 SSR en lugar de Next.js?
- ¿Por qué Cloudinary y no S3 + CloudFront?

**Impacto**: cuando llegue el momento de cambiar uno, nadie va a saber qué tradeoffs se evaluaron. Re-debate eterno.

### 5. Sin onboarding paso a paso — MEDIO

**Evidencia**: ningún doc del estilo "cómo correr local en 10 minutos". El dev tiene que ir picoteando entre el README raíz, el de backend, el de frontend, y leer `backend/src/index.ts`, `backend/src/db.ts`, `backend/src/migrate.ts`, etc.

**Impacto**: tiempo de onboarding alto, errores tontos al levantar el entorno.

### 6. Sin CONTRIBUTING ni CODEOWNERS — BAJO

**Evidencia**: ambos ausentes.

**Impacto**: si crece el equipo, las convenciones (branch naming, commit style, PR review) son orales. Conventional commits está implícito en el historial (`feat:`, `fix:`) pero no documentado.

## Recomendaciones

### P0 — esta semana

**(a) Backend README real** (`backend/README.md`):

````markdown
# Backend — Estudio Glow

Express 5 sobre Bun, Drizzle ORM, Postgres.

## Setup local

```bash
cd backend
cp .env.example .env   # editar valores
bun install
bun run migrate        # corre migraciones
bun run seed           # opcional: datos de prueba
bun run dev            # http://localhost:3000
```

API docs en `http://localhost:3000/api-docs`.

## Variables de entorno

Ver `.env.example`. Críticas: `DATABASE_URL`, `JWT_SECRET`, `CLOUDINARY_*`, `MP_ACCESS_TOKEN`.

## Comandos

| Comando            | Qué hace                                        |
|--------------------|-------------------------------------------------|
| `bun run dev`      | Server con `--watch`                            |
| `bun run start`    | Server modo producción                          |
| `bun run migrate`  | Aplica migraciones Drizzle                      |
| `bun run generate` | Genera nueva migración a partir del schema      |
| `bun run seed`     | Inserta datos de prueba                         |

## Arquitectura

- Routes → Controllers → Services → Models (Drizzle)
- Errores: clases en `src/errors/`, manejados en `src/middleware/error-handler.ts`
- Auth: JWT en cookie HttpOnly + middleware en `src/middleware/auth.ts`
````

**(b) Frontend README real** (`frontend/README.md`):

````markdown
# Frontend — Estudio Glow

React Router 7 SSR, deployado en Vercel via `@vercel/react-router`.

## Setup local

```bash
cd frontend
cp .env.example .env       # API_BASE_URL, SESSION_SECRET
bun install
bun run dev                # http://localhost:5173
```

Asegurate de tener el backend corriendo en `http://localhost:3000`.

## Estructura

- `app/routes/` — rutas SSR (loader + action + component)
- `app/common/components/` — UI reutilizable (atomic-ish)
- `app/common/services/` — clientes HTTP al backend
- `app/actions/` — server actions / form handlers

## Deploy

Push a `main` dispara deploy en Vercel automáticamente. Preview deployments en cada PR.
````

**(c) Completar OpenAPI**: agregar a `backend/src/docs/openapi.ts:5-8`:

```ts
import "./auth";
import "./products";
import "./categories";
import "./dashboard";
import "./cart";
import "./checkout";
import "./orders";
import "./favorites";
import "./users";
import "./webhooks";
import "./public";
```

Y crear los archivos correspondientes con `registry.registerPath(...)` para cada endpoint real. Política: **PR que toca una ruta debe actualizar su definición OpenAPI**.

### P1 — próximas dos semanas

**(d) `docs/onboarding.md`** — paso a paso end-to-end:

```markdown
# Onboarding

## Requisitos
- Bun 1.x
- Postgres 14+ (local o Docker)
- Cuenta Cloudinary, MercadoPago test, Google Cloud Console

## Pasos
1. Clonar repo
2. Levantar Postgres local: `docker run --name glow-pg -e POSTGRES_PASSWORD=dev -p 5432:5432 -d postgres:16`
3. Crear DB: `createdb estudio_glow` (o `psql -c "CREATE DATABASE estudio_glow"`)
4. Backend: ver backend/README.md
5. Frontend: ver frontend/README.md
6. (Opcional) MP webhooks locales: ngrok + setear `WEBHOOK_URL`
```

**(e) ADRs** — `docs/adr/0001-record-architecture-decisions.md` (meta-ADR), luego uno por decisión grande. Formato Michael Nygard: Status, Context, Decision, Consequences. Bajo costo, alto valor.

**(f) `CONTRIBUTING.md`**:

```markdown
# Contributing

## Branches
- `main` → producción
- `feat/*`, `fix/*`, `chore/*` → PRs

## Commits
Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.

## PRs
- CI debe pasar (typecheck)
- Cambios a rutas → actualizar OpenAPI
- Cambios a schema DB → migration + nota en PR
```

### P2 — backlog

- Diagrama C4 nivel 1 y 2 en `docs/architecture/`.
- Runbook de incidentes (qué hacer si MP webhook falla, si Cloudinary se cae, etc.).
- Storybook o similar para los componentes del frontend.

## Referencias

- `README.md:1-38`
- `backend/README.md:1-15`
- `frontend/README.md:1-87`
- `backend/src/docs/openapi.ts:5-8`
- `backend/src/routes/` (11 routers reales vs 4 documentados)
- [ADR template (Michael Nygard)](https://github.com/joelparkerhenderson/architecture-decision-record)
- [Conventional Commits](https://www.conventionalcommits.org/)
