# 11. DevOps y Deploy

Auditoría de Dockerfiles, gestión de secretos, CI/CD, migraciones, hooks, backups y rollback.

## Estado actual

- **`.env`**: backend y frontend tienen `.env` en disco. `git ls-files | grep env` → vacío (BIEN, no están commiteados). `backend/.gitignore:19-23` los excluye. `.gitignore` raíz solo tiene `.cursor/` y `.engram` — no excluye `.env` a nivel raíz, pero los gitignore de cada subdir lo cubren.
- **`.env.example`**: NO EXISTE en ningún subproyecto.
- **MercadoPago**: `backend/src/routes/webhooks.ts:7` y `backend/src/services/MercadoPagoService.ts:5` tienen `|| 'test_token'` y `|| 'APP_USR-testing_token'`. Mismo anti-pattern.
- **Migraciones**: `bun run migrate` invoca `src/migrate.ts` (`backend/src/migrate.ts:13`). Manual. No hay paso automático en deploy.
- **CI/CD**: NO EXISTE `.github/workflows/`, `.gitlab-ci.yml`, `vercel.json`, ni `render.yaml`. (Verificado con `find -maxdepth 4`.)
- **Pre-commit hooks**: NO hay husky, lefthook ni lint-staged.
- **Backups Postgres**: indeterminado (depende del provider). No documentado.
- **Rollback strategy**: no documentada.
- **Lockfiles inconsistentes**: backend tiene `bun.lock` Y `package-lock.json` (1261 vs 72080 bytes). Frontend igual. Los `package-lock.json` son chatarra de un `npm install` accidental.

## Problemas detectados

### 1. `.env.example` ausente — ALTO

> ✅ **RESUELTO 2026-05-15** — Ver [docs/fixed/resolved/11-devops-deploy.md](../resolved/11-devops-deploy.md) para el detalle del fix. Falta CI y deduplicar lockfiles.

**Evidencia**: `find . -name ".env.example"` → vacío.

Variables observadas que un nuevo dev necesita:
- `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `FRONTEND_URL_PREVIEW`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `MP_ACCESS_TOKEN`, `WEBHOOK_URL`
- `GOOGLE_CLIENT_ID`
- Frontend: `API_BASE_URL`, `VITE_API_BASE_URL`, `SESSION_SECRET`

**Impacto**: onboarding requiere leer todo el código para descubrir qué env vars setear. Errores silenciosos por env vars faltantes (ver problema 2).

### 2. Sin CI/CD — ALTO

**Evidencia**: no hay `.github/workflows/`. Cada push a `main` deploya sin lint, sin typecheck, sin tests (no hay tests).

**Impacto**: regresiones de TypeScript y errores tontos llegan a producción. La commit history reciente ("feat: mejoras en frontend y backend - componentes UI") no inspira confianza sin checks.

### 3. Migraciones sin paso automático en deploy — ALTO

**Evidencia**: `package.json` tiene `"migrate": "bun run src/migrate.ts"` pero no hay `release` command en Render ni hook que lo ejecute.

**Impacto**: deploys "exitosos" con DB desactualizada. Errores 500 en runtime hasta que alguien recuerde correr `bun run migrate` a mano.

### 4. Lockfiles duplicados — MEDIO

**Evidencia**: `backend/package-lock.json` (72KB) y `backend/bun.lock` (66KB) coexisten. Frontend igual.

**Impacto**: si alguien corre `npm install`, regenera `node_modules` con resoluciones diferentes a las de `bun install`. Source of truth ambiguo.

### 5. Sin pre-commit hooks — MEDIO

**Evidencia**: no hay `husky`, `lefthook`, `lint-staged`, ni siquiera ESLint/Prettier configurados a nivel del repo.

**Impacto**: estilo inconsistente, errores que se cazan tarde.

### 6. Backups y rollback no documentados — MEDIO

**Evidencia**: nada en `docs/`. README no menciona estrategia.

**Impacto**: si Postgres se rompe, no hay procedimiento. Si un deploy rompe prod, ¿cómo se vuelve atrás? Render permite rollback de instancia pero no toca DB schema.

## Recomendaciones

### P0 — esta semana

**(a) `.env.example` en backend y frontend**:

```dotenv
# backend/.env.example
NODE_ENV=development
DATABASE_URL=postgres://user:pass@localhost:5432/estudio_glow
JWT_SECRET=replace-with-openssl-rand-base64-32-min
FRONTEND_URL=http://localhost:5173
FRONTEND_URL_PREVIEW=https://*.vercel.app
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
MP_ACCESS_TOKEN=APP_USR-...
WEBHOOK_URL=https://your-ngrok.url/api/webhooks/mercadopago
GOOGLE_CLIENT_ID=
```

**(b) Borrar `package-lock.json`**:

```bash
rm backend/package-lock.json frontend/package-lock.json
```

Y agregar regla en `.gitignore` raíz: `package-lock.json`.

### P1 — próximas dos semanas

**(e) GitHub Actions mínimo** (`.github/workflows/ci.yml`):

```yaml
name: CI
on: [pull_request]
jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - working-directory: backend
        run: bun install --frozen-lockfile && bunx tsc --noEmit
      - working-directory: frontend
        run: bun install --frozen-lockfile && bun run typecheck
```

**(f) Render `release` command**:

En Render dashboard → Settings → Pre-Deploy Command: `bun run migrate`. Garantiza que migraciones corren antes de aceptar tráfico.

Mejor aún: `render.yaml` versionado:

```yaml
services:
  - type: web
    name: estudio-glow-backend
    runtime: docker
    healthCheckPath: /ready
    envVars:
      - key: NODE_ENV
        value: production
    preDeployCommand: bun run migrate
```

**(g) Husky + lint-staged**:

```bash
bun add -D husky lint-staged
bunx husky init
```

`.husky/pre-commit`: `bunx lint-staged`.

`package.json` raíz:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["bunx tsc --noEmit"]
  }
}
```

**(h) Documentar backup/rollback**:

Crear `docs/operations/backup-rollback.md`:
- Backup: Render Postgres tiene backups automáticos diarios — verificar retention y documentar restore.
- Rollback app: Render → Deploys → Rollback (no toca DB).
- Rollback DB: requiere migrations reversibles — política: cada migration nueva debe traer un script `down` documentado.

### P2 — backlog

- `vercel.json` con headers explícitos para `/build/client/assets/*` (immutable).
- Dependabot/Renovate.
- Branch protection rules en GitHub.
- Secrets scanning con gitleaks en CI.

## Referencias

- `backend/src/middleware/auth.ts:8`
- `backend/src/controller/auth.ts:21`
- `backend/src/controller/google.ts:16`
- `backend/src/routes/webhooks.ts:7`
- `backend/src/services/MercadoPagoService.ts:5`
- `backend/src/migrate.ts:13`
- [Render: Pre-Deploy Commands](https://render.com/docs/deploy-commands)
