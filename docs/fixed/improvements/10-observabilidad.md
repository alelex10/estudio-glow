# 10. Observabilidad

Auditoría de logging, error tracking, métricas, tracing, audit log y reporting cliente.

## Estado actual

- **Logging backend**: 100% `console.log` / `console.error`. 37 ocurrencias en `backend/src/`. No hay pino, winston, ni logger estructurado.
- **Error handler**: `backend/src/middleware/error-handler.ts:22-48` usa `console.error` con un objeto plano `{ timestamp, method, path, errorName, errorMessage }`. No hay `requestId`, `userId`, ni `correlation-id`.
- **Sin Sentry/Bugsnag/Datadog**: ningún SDK de error tracking en `backend/package.json` ni `frontend/package.json`. Errores en producción son INVISIBLES más allá de los logs de Render/Vercel.
- **Sin métricas**: no hay `prom-client`, ni endpoint `/metrics`. No se puede medir RPS, p50/p95/p99 de latencia, error rate, ni saturación de pool.
- **Health endpoint**: NO existe (`grep -rln "/health" backend/src/` → vacío).
- **Audit log**: ningún registro en DB de cambios admin. Si un admin borra un producto o cambia un precio, no queda traza.
- **Frontend**: `frontend/app/root.tsx:64-91` define `ErrorBoundary` que solo pinta el error; no reporta a ningún sistema.
- **Tracing**: no hay OpenTelemetry instrumentado.
- **Console en frontend**: 10 archivos con `console.*` (mayormente debug residual).

## Problemas detectados

### 1. Producción CIEGA: sin error tracking — ALTO

**Evidencia**: `console.error` + Render/Vercel logs es lo único disponible. Si un usuario reporta "no me deja pagar", no hay forma de buscar SU error. Sin agrupación, sin alerts, sin contexto de release/usuario.

**Impacto**: tiempo medio de detección (MTTD) y de resolución (MTTR) explotan. Errores intermitentes pasan desapercibidos hasta que un usuario molesto escribe.

### 2. Logs no estructurados — ALTO

**Evidencia**: `backend/src/middleware/error-handler.ts:30-39` usa dos `console.error` separados: el primero es un string `"❌ Error capturado:"`, el segundo un objeto. Render captura cada `console.error` como una línea separada → en logs de producción quedan partidos. Imposible parsear con jq, grep estructurado, o exportar a Loki/Datadog.

**Impacto**: cero observabilidad real. Los logs son útiles solo si abrís el dashboard de Render y leés a ojo.

### 3. Sin `requestId` ni correlación — ALTO

**Evidencia**: el log NO incluye un id que ate múltiples logs del mismo request. Si una request hace 3 queries y falla en la última, no podés correlacionar.

**Impacto**: debugging en multi-tenant/concurrencia se vuelve adivinanza.

### 4. Sin `/health` ni `/ready` — ALTO

**Evidencia**: `backend/src/index.ts:87-89` solo expone `GET /` con un mensaje hardcoded. Render no puede health-checkear bien sin un endpoint dedicado. Si la DB cae, el proceso sigue "vivo" y Render no rota.

**Impacto**: deploys mal detectados, recovery manual.

### 5. Sin métricas — MEDIO

**Evidencia**: no hay `prom-client` ni endpoint `/metrics`. Render expone CPU/memory pero no app metrics (RPS, latencia, errores 5xx).

**Impacto**: no se puede dimensionar el plan ni detectar regresiones de performance.

### 6. Sin audit log de cambios admin — MEDIO (cumplimiento)

**Evidencia**: rutas `backend/src/routes/products.ts`, `categories.ts`, `orders.ts` no escriben a una tabla `audit_logs` cuando un admin modifica entidades.

**Impacto**: si hay disputa con un cliente sobre un cambio de precio, no hay forma de saber quién/cuándo. Para e-commerce esto es serio.

### 7. ErrorBoundary del frontend silente — MEDIO

**Evidencia**: `frontend/app/root.tsx:64-91`. Pinta el error, no lo reporta.

**Impacto**: errores de hydration/render en cliente nunca llegan al equipo.

### 8. `console.*` residual en frontend — BAJO

**Evidencia**: 10 archivos con `console.*`. Muchos son `console.error` legítimos en catch, otros parecen debug.

**Impacto**: ruido en consola del usuario, posible leak de información.

## Recomendaciones

### P0 — esta semana

**(a) Sentry en backend y frontend**:

```bash
# backend
bun add @sentry/bun
# frontend
bun add @sentry/react
```

```ts
// backend/src/index.ts (al inicio)
import * as Sentry from "@sentry/bun";
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  release: process.env.RENDER_GIT_COMMIT,
});
```

Frontend: instrumentar en `entry.client.tsx` y reportar en `ErrorBoundary` con `Sentry.captureException(error)`.

Plan free de Sentry alcanza para empezar (5k errores/mes).

**(b) Logger estructurado con pino**:

```bash
bun add pino pino-http
```

```ts
// backend/src/lib/logger.ts
import pino from "pino";
export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  redact: ["req.headers.authorization", "req.headers.cookie", "*.password"],
});
```

```ts
// backend/src/index.ts
import pinoHttp from "pino-http";
import { randomUUID } from "node:crypto";

app.use(pinoHttp({
  logger,
  genReqId: (req) => (req.headers["x-request-id"] as string) ?? randomUUID(),
  customLogLevel: (req, res, err) => {
    if (res.statusCode >= 500 || err) return "error";
    if (res.statusCode >= 400) return "warn";
    return "info";
  },
}));
```

Reemplazar `console.error` en `error-handler.ts` por `req.log.error({ err })`.

**(c) Health endpoint**:

```ts
// backend/src/routes/health.ts
import { Router } from "express";
import { sql } from "drizzle-orm";
import { db } from "../db";

export const healthRouter = Router();

healthRouter.get("/health", (_, res) => res.json({ status: "ok" }));

healthRouter.get("/ready", async (_, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ready" });
  } catch {
    res.status(503).json({ status: "degraded" });
  }
});
```

Configurar Render: `Health Check Path = /ready`.

### P1 — próximas dos semanas

**(d) Audit log para entidades sensibles**:

Tabla `audit_logs (id, actor_user_id, action, entity, entity_id, before jsonb, after jsonb, ip, user_agent, created_at)`. Wrapper en services o un middleware Express.

**(e) Métricas con prom-client**:

```bash
bun add prom-client
```

`/metrics` protegido por auth básica o IP allowlist. Exponer histograma de latencia por ruta + counter de errores.

**(f) Limpiar `console.*` del frontend**:

`grep -rn "console\." frontend/app --include="*.ts" --include="*.tsx"` → revisar cada uno. Reemplazar logs de debug por nada o por un wrapper con flag `import.meta.env.DEV`.

### P2 — backlog

- OpenTelemetry para tracing distribuido (cuando se separe el cron en otro servicio).
- Dashboard en Grafana Cloud (free tier) o Datadog.
- Alerts en Sentry para error rate spikes.

## Referencias

- `backend/src/middleware/error-handler.ts:22-48`
- `backend/src/index.ts:87-89,110-126`
- `frontend/app/root.tsx:64-91`
- `backend/src/services/CronService.ts:24-26` (catch sin contexto)
- [pino docs](https://getpino.io/)
- [Sentry for Bun](https://docs.sentry.io/platforms/javascript/guides/bun/)
- [prom-client](https://github.com/siimon/prom-client)
