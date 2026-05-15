# 09. Performance y Cache

Auditoría de performance, caché HTTP, optimización de imágenes, bundle, connection pool y compresión.

## Estado actual

- **Backend**: Express 5 + Bun, sin `compression`, sin caché HTTP, sin headers `Cache-Control` en endpoints públicos. Ver `backend/src/index.ts:78-101`.
- **DB**: Postgres con `postgres-js` instanciado **sin pool config explícita** y con `prepare: false` (modo Transaction de pgBouncer). Ver `backend/src/db.ts:13`. No hay `max`, ni `idle_timeout`, ni `connect_timeout`, ni `statement_timeout`.
- **Cron in-process**: `setInterval` cada 60s dentro del proceso web. Ver `backend/src/services/CronService.ts:7-27`. Se arranca incondicionalmente desde `index.ts:104`.
- **Imágenes (server)**: `sharp` resize a 1200px y se delega `f_auto,q_auto` a Cloudinary. Bien hecho. Ver `backend/src/middleware/optimize.ts:14-26` y `backend/src/services/imageUploadService.ts:21-51`.
- **Imágenes (client)**: helper `getCloudinaryUrl(url, width)` aplica `f_auto,q_auto,w_{n}`. Bien. Ver `frontend/app/common/lib/utils.ts:22-37`.
- **Activos estáticos del frontend**: `<img src="/img/home/home-2.avif">` servido desde `frontend/public/`. Ver `frontend/app/routes/home/home.tsx:27`. No tienen `loading="lazy"` ni `width/height` explícitos (CLS).
- **SSR cache**: NINGUNA ruta exporta `headers()` con `Cache-Control`. Verificado con `grep -rn "headers" frontend/app/routes/ --include="*.tsx"` → solo aparece `headers` como prop, nunca como export.
- **Bundle / code-splitting**: Vite + React Router 7 hace code-splitting por ruta automáticamente. No hay configuración custom en `frontend/vite.config.ts:1-8` (mínimo).
- **Compression**: NO instalado (`compression` no aparece en `backend/package.json`).
- **`<link rel="preconnect">`**: el `root.tsx` tiene `preconnect` apuntando a `"/"` — INÚTIL. Ver `frontend/app/root.tsx:31-33`. Debería preconectarse a la API (Render) y a Cloudinary.

## Problemas detectados

### 1. README MIENTE sobre la "arquitectura de caché de dos niveles" — ALTO

> ✅ **RESUELTO 2026-05-15** — Ver [docs/fixed/resolved/12-documentacion.md](../resolved/12-documentacion.md) para el detalle del fix.

**Evidencia**: `README.md:9` linkea `./docs/architecture/arquitectura-cache.md` y `README.md:14` afirma "Arquitectura de caché de dos niveles (global + por usuario)". El archivo NO existe (`docs/` solo contiene `improvements/`). Ninguna route del frontend exporta `headers()`. No hay `s-maxage` en ninguna respuesta.

**Impacto**: documentación engañosa, onboarding falso, y (peor) NO HAY caché real. Cada request de home, products listing, categories pega a Render → DB. En Render plan free/starter esto se nota: cold start + latencia de DB en cada navegación.

### 2. Connection pool de Postgres sin configurar — ALTO

**Evidencia**: `backend/src/db.ts:13` → `postgres(connectionString, { prepare: false })`. Default de `postgres-js` es `max: 10`. En Render el contenedor podría tolerar más, pero más crítico: NO hay `idle_timeout` ni `connect_timeout` ni `statement_timeout`. Una query colgada bloquea una conexión indefinidamente.

**Impacto**: bajo carga real, conexiones quedan abiertas, queries lentas no se matan, el proceso se vuelve no-responsivo. En multi-instancia (Render scaling) el límite efectivo se multiplica y puede saturar Postgres.

### 3. Cron in-process en multi-instancia — ALTO (correctness)

**Evidencia**: `backend/src/services/CronService.ts:7` arranca un `setInterval` en cada proceso. `backend/src/index.ts:104` lo invoca incondicionalmente.

**Impacto**: si Render escala a 2+ instancias, **N instancias ejecutan el mismo job simultáneamente** → race conditions cancelando órdenes y dobles UPDATEs sobre `orders`. Hoy probablemente corre con 1 instancia, pero es una bomba de tiempo.

### 4. Sin Cache-Control en SSR — ALTO

**Evidencia**: ninguna ruta de `frontend/app/routes/**` exporta `headers()`. La home (`home.tsx:15-18`) hace fetch de `/products/new` en cada SSR. Productos públicos no cachean ni en Vercel Edge ni en CDN del navegador.

**Impacto**: Vercel cobra por invocaciones de función SSR. Sin `s-maxage`, cada visita única dispara una invocación + un fetch al backend. En tráfico real, esto multiplica costo y latencia.

### 5. Sin `compression` middleware en Express — MEDIO

**Evidencia**: `backend/package.json` no tiene `compression`. `backend/src/index.ts:78-79` solo usa `express.json()` y `cookieParser()`.

**Impacto**: respuestas JSON grandes (listings de productos con muchos items) se sirven sin gzip/brotli. Render normalmente NO comprime por sí mismo. Latencia y bandwidth innecesarios.

### 6. `<img>` del home sin `width/height/loading` — MEDIO (CLS y LCP)

**Evidencia**: `frontend/app/routes/home/home.tsx:27` → `<img className="py-20" src="/img/home/home-2.avif" alt="" />`. Sin `width`, `height`, `loading`, `decoding`.

**Impacto**: Cumulative Layout Shift al cargar y un download bloqueante si está above-the-fold. Lighthouse mobile penaliza fuerte.

### 7. `preconnect` mal apuntado — BAJO

**Evidencia**: `frontend/app/root.tsx:31-32` → `{ rel: "preconnect", href: "/" }, { rel: "dns-prefetch", href: "/" }`. Apuntar a `/` no hace nada útil; el browser ya está conectado al origin.

**Impacto**: pierde el beneficio real (preconectar a `https://res.cloudinary.com` y a la API en Render).

### 8. Static assets del frontend sin headers immutable — MEDIO

**Evidencia**: no hay `vercel.json` que defina headers para `/build/client/assets/*`. Vercel por default cachea bien los assets hasheados, pero no se documenta ni se fuerza.

**Impacto**: depende del default de Vercel. Funciona pero no auditado.

### 9. `getNewProducts` sin caché en client/SSR — MEDIO

**Evidencia**: `home.tsx:15-18`. Cada SSR refetchea desde el backend.

**Impacto**: ver punto 4. Combinado, la home tiene cero caching layer.

## Recomendaciones

### P0 — esta semana

**(a) Borrar la mentira del README o crear el doc**:

Opción A: editar `README.md:9` y `README.md:14` y eliminar la promesa hasta que exista. Opción B: crear `docs/architecture/arquitectura-cache.md` con la estrategia real (recomendado, ver abajo).

**(b) Configurar el pool de Postgres**:

```ts
// backend/src/db.ts
const client = postgres(connectionString, {
  prepare: false,
  max: Number(process.env.DB_POOL_MAX ?? 10),
  idle_timeout: 20,           // s
  connect_timeout: 10,        // s
  max_lifetime: 60 * 30,      // 30 min
  // statement_timeout en server-side via SET en connection:
  connection: { statement_timeout: '15000' }, // 15s
});
```

**(c) Mover crons fuera del proceso web**:

Tres opciones, en orden de pragmatismo:
1. **Render Cron Job** (servicio separado, free tier disponible) que invoke un endpoint `POST /internal/cron/expire-orders` protegido con un secret header.
2. **pg_cron** si Postgres lo soporta (depende del provider).
3. Guard rápido si solo usás 1 instancia: `if (process.env.RUN_CRONS !== "true") return;` y exponer la flag SOLO en una instancia. No es robusto pero compra tiempo.

### P1 — próximas dos semanas

**(d) Cache-Control en rutas SSR públicas**:

```ts
// frontend/app/routes/home/home.tsx
export function headers() {
  return {
    "Cache-Control":
      "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
  };
}
```

Aplicar a: home, listings de productos, detalle de producto, categorías. NO aplicar a rutas autenticadas (admin, cart, orders) → ahí mantener `private, no-store`.

**(e) Compression en Express**:

```bash
bun add compression @types/compression
```

```ts
// backend/src/index.ts
import compression from "compression";
app.use(compression());
```

**(f) Healthcheck endpoint**:

```ts
app.get("/health", async (req, res) => {
  try {
    await db.execute(sql`SELECT 1`);
    res.json({ status: "ok", uptime: process.uptime() });
  } catch (e) {
    res.status(503).json({ status: "degraded" });
  }
});
```

Configurar Render para usar este endpoint como health check.

**(g) Fix `preconnect`**:

```ts
// frontend/app/root.tsx
export function links() {
  return [
    { rel: "preconnect", href: "https://res.cloudinary.com" },
    { rel: "preconnect", href: process.env.API_BASE_URL ?? "" },
    { rel: "stylesheet", href: appCssHref },
  ];
}
```

**(h) `<img>` del hero**:

```tsx
<img
  src="/img/home/home-2.avif"
  alt=""
  width={1600}
  height={900}
  loading="lazy"          // o eager si está above-the-fold + fetchpriority="high"
  decoding="async"
  className="py-20"
/>
```

### P2 — backlog

- Considerar Redis (Upstash free) para caché de listados y rate-limiting.
- `srcset`/`sizes` real con `getCloudinaryUrl(url, 400|800|1200)` para imágenes responsive.
- Auditoría con Lighthouse CI en GH Actions.

## Referencias

- `README.md:9,14`
- `backend/src/db.ts:13`
- `backend/src/index.ts:78-104`
- `backend/src/services/CronService.ts:7-27`
- `backend/src/middleware/optimize.ts:14-26`
- `frontend/app/root.tsx:29-35`
- `frontend/app/routes/home/home.tsx:15-18,27`
- `frontend/app/common/lib/utils.ts:22-37`
- [postgres-js options](https://github.com/porsager/postgres#all-postgres-options)
- [React Router headers export](https://reactrouter.com/start/framework/route-module#headers)
