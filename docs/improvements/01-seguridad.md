# 1. Seguridad

> Auditoría de seguridad del backend (Express 5 + Bun + Drizzle + JWT). Foco transversal: hardening del servidor, validación, uploads, webhooks, secretos, headers.
> Para análisis específico de auth/RBAC ver [`02-auth-authorization.md`](./02-auth-authorization.md).

## Estado actual

- Stack: Express 5, Bun, Drizzle ORM (postgres-js), `jsonwebtoken`, `bcryptjs`, `cookie-parser`, `cors`, `multer` + `sharp` + Cloudinary, MercadoPago SDK, Zod.
- `backend/src/index.ts:78` — `app.use(express.json())` SIN límite de tamaño.
- `backend/src/index.ts:39-77` — CORS con bypass total en desarrollo (`if (isDevelopment) return callback(null, true)`).
- `backend/src/index.ts` — NO usa `helmet`, NO `express-rate-limit`, NO `csurf`. Verificado en `backend/package.json` (no figuran como dependencias).
- `backend/src/middleware/file-validation.ts` — multer en memoria, valida sólo `mimetype` (header), no magic bytes; sin sanitización de nombre.
- `backend/src/middleware/optimize.ts:18` — `sharp(req.file.buffer).resize(...).toBuffer()` actúa como validador implícito (rechaza no-imagen) en uploads de productos, pero NO se aplica al upload de comprobantes (`/checkout/transfer`).
- `backend/src/routes/webhooks.ts:11-24` — webhook MercadoPago SIN validación de firma `x-signature` / `x-request-id`.
- `backend/src/services/MercadoPagoService.ts:5` — fallback hardcoded `'APP_USR-testing_token'` si falta env.
- `backend/src/db.ts:1-14` — `postgres(connectionString, { prepare: false })`; sin SSL explícito.
- `backend/src/seeds/data/user.ts:8-23` — passwords admin hardcoded en texto plano dentro del repo.
- `backend/Dockerfile:2` — `FROM oven/bun:1.1.4`, corre como `root`, no usa `--production`.
- `backend/docker-compose.yml:13-14` — bind-mount `.:/app` expone `.env` y código al contenedor en runtime.
- Errores: `backend/src/middleware/error-handler.ts:122-134` — en producción enmascara mensaje, OK; pero `console.error` loggea path/método sin redactar.
- SQL: el uso de `sql\`\`` está limitado a defaults de schema (`gen_random_uuid()`); no se concatena input de usuario en raw SQL. Drizzle parametriza con `eq`, `ilike`, etc. — riesgo SQLi BAJO.

## Problemas detectados

### 1. [CRÍTICO] Webhook de MercadoPago sin validación de firma HMAC

- **Descripción:** el endpoint `/api/webhooks/mercadopago` acepta cualquier POST sin verificar que provenga realmente de MercadoPago. Cualquiera con la URL pública puede dispararlo.
- **Evidencia:** `backend/src/routes/webhooks.ts:11-24`. No se leen los headers `x-signature` ni `x-request-id`, no se calcula HMAC SHA256.
- **Impacto:** un atacante puede llamar el webhook con un `data.id` real obtenido de cualquier orden y, si la API de MP devuelve `status: approved` para ese pago, marca la orden como pagada (`OrderService.markOrderPaid`). Aún si MP filtra por accessToken, el endpoint acepta `(action === "payment.updated" || type === "payment")` como gating — basta con que `data.id` exista. Esto puede usarse para forzar reintentos, observar comportamiento de error, o disparar lógica de pago. Combinado con la falta de rate limit, es un vector serio.

### 2. [CRÍTICO] CORS abierto a cualquier origen en desarrollo

- **Descripción:** `if (isDevelopment) return callback(null, true)` permite que CUALQUIER origen, incluido un sitio malicioso, haga requests con `credentials: true`.
- **Evidencia:** `backend/src/index.ts:42-46`.
- **Impacto:** si `NODE_ENV` no se setea explícitamente en producción (Render, Docker, etc.), por default queda como "no-production" y el guard `isDevelopment === "development"` igual evalúa `false`, pero cualquier deploy mal-configurado (NODE_ENV=development en stage o accidental) abre CSRF cross-origin completo: junto con `credentials: true` y cookies con `sameSite: "lax"` (en dev) un sitio externo puede leer la respuesta a operaciones autenticadas. La mitigación correcta es nunca permitir `*` con `credentials: true` — incluso en dev.

### 3. [CRÍTICO] Passwords de admin commiteadas en texto plano

- **Descripción:** los seeds contienen email + password en claro de cuentas con rol `admin`.
- **Evidencia:** `backend/src/seeds/data/user.ts:8-23` — `"yasitacardenas3637@gmail.com" / "estudioglow@423"` y `"elvizvida@gmail.com" / "User@1234"`.
- **Impacto:** cualquiera con acceso al repo (público o privado filtrado) tiene credenciales de administrador. Si el seed se corre alguna vez en producción, el atacante toma control total del backoffice (crear/borrar productos, ver órdenes de todos los usuarios, etc.).

### 4. [ALTO] Sin rate limiting en endpoints sensibles

- **Descripción:** no hay `express-rate-limit` ni equivalente. `/auth/login`, `/auth/register`, `/auth/google/login`, webhooks y el endpoint público de búsqueda de productos están abiertos a fuerza bruta y abuso.
- **Evidencia:** `backend/package.json` no incluye `express-rate-limit`; `backend/src/index.ts` no monta middleware de rate limit; `bcrypt` con `saltRounds=10` (`backend/src/controller/auth.ts:77`) es ~100ms por intento, suficiente para credential stuffing distribuido.
- **Impacto:** brute force de credenciales, enumeración de emails (ver problema 8), DoS a endpoints costosos como `/products/search` (LIKE `%q%`) y al webhook (que hace request HTTP a la API de MP por cada hit).

### 5. [ALTO] Sin headers de seguridad (helmet)

- **Descripción:** la app no aplica `Content-Security-Policy`, `Strict-Transport-Security`, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, etc.
- **Evidencia:** `backend/package.json` no lista `helmet`; `backend/src/index.ts` no usa headers de seguridad.
- **Impacto:** clickjacking del backoffice si se renderiza vía Swagger UI (`/api-docs`), MIME sniffing, downgrade de HTTPS, exposición de `Referer` con tokens en query string.

### 6. [ALTO] Validación de archivos subidos por mimetype del cliente, sin magic-bytes

- **Descripción:** `imageFileFilter` valida `file.mimetype` que viene del cliente y es trivialmente falsificable; no se chequean magic bytes (cabecera del archivo). El nombre original tampoco se sanitiza.
- **Evidencia:** `backend/src/middleware/file-validation.ts:6-34`.
- **Impacto:** parcial. Para `/products` el middleware `optimizeImage` (`sharp(...)`) actúa como validador efectivo: si el buffer no es una imagen real, `sharp` lanza y se rechaza. Pero el endpoint `/checkout/transfer` (`backend/src/routes/checkout.ts:31-42`) hace `validateImageFile(5)` SIN pasar por `sharp` — sube directamente a Cloudinary. Cloudinary también valida pero el mimetype declarado puede afectar URLs y headers. Riesgo principal: subir contenido no-imagen marcado como `image/png`.

### 7. [ALTO] Sin límite de tamaño en `express.json()`

- **Descripción:** `app.use(express.json())` queda en el default de Express 5 (~100kb) que mitiga parcialmente, pero no se hace explícito ni se controla `urlencoded`. Más importante: NO se montan límites por ruta para endpoints que aceptan grandes payloads (ej. `/cart/sync`).
- **Evidencia:** `backend/src/index.ts:78`.
- **Impacto:** payload bombs en endpoints autenticados que iteran arrays (cart sync, futuras bulk APIs). Recomendado fijar explícitamente `limit: '64kb'` o similar y elevarlo sólo donde haga falta.

### 8. [ALTO] Hardcoded fallback de MercadoPago accessToken

- **Descripción:** `accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-testing_token'` y `'test_token'` en otro archivo. Si la env no se setea en producción, el SDK arranca igual con un token inválido y los errores aparecen sólo al primer request.
- **Evidencia:** `backend/src/services/MercadoPagoService.ts:5` y `backend/src/routes/webhooks.ts:7`.
- **Impacto:** en producción, fallar silenciosamente al startup vs. fallar tarde con cualquier orden — el primer caso es siempre mejor. Lo correcto es lanzar al boot si falta la env.

### 9. [MEDIO] Sin SSL forzado en conexión a Postgres

- **Descripción:** `postgres(connectionString, { prepare: false })` no fuerza `ssl: 'require'` en producción. Depende de que el `DATABASE_URL` lo incluya.
- **Evidencia:** `backend/src/db.ts:13`.
- **Impacto:** si la URL no contiene `sslmode=require` (común en Render con `?ssl=true`), las credenciales viajan en claro en la red interna. Mitigable explícitamente desde código.

### 10. [MEDIO] Dockerfile corre como root y monta el código completo

- **Descripción:** `oven/bun:1.1.4` corre como root por default; `docker-compose.yml` hace `volumes: - .:/app` exponiendo `.env`, `.git/`, `node_modules`, etc. El `CMD ["bun", "run", "dev"]` arranca con `--watch` (modo dev).
- **Evidencia:** `backend/Dockerfile:2,20`, `backend/docker-compose.yml:13-14`.
- **Impacto:** si el contenedor es comprometido (RCE), el atacante hereda root dentro del container y acceso al árbol completo. El compose está OK para desarrollo local, pero el Dockerfile NO debería arrancar en `dev` ni el `CMD` hacer hot reload — son artefactos productivos.

### 11. [MEDIO] Stack traces y error.message expuestos al cliente fuera de producción

- **Descripción:** el `errorHandler` final responde `err.message` cuando `NODE_ENV !== "production"`. Si el deploy queda en cualquier valor distinto de exactamente `"production"` (typo, undefined), expone mensajes internos.
- **Evidencia:** `backend/src/middleware/error-handler.ts:122-134`.
- **Impacto:** disclosure de errores de Drizzle, paths internos, nombres de variables. Es preferible whitelistear el modo verbose (`isDev === "development"`) en vez de blacklistear producción.

### 12. [MEDIO] Logs con datos potencialmente sensibles

- **Descripción:** `console.log(JSON.stringify({ ip: req.ip, email, ... }))` en `googleLogin`. No es secreto, pero en logs centralizados puede ser PII regulada (GDPR).
- **Evidencia:** `backend/src/controller/google.ts:246-389`.
- **Impacto:** retención inadvertida de PII; debería existir política de redacción.

### 13. [BAJO] Cookie sin `path` ni `domain` ni firma explícitos

- **Descripción:** la cookie `token` se setea con `httpOnly`, `secure` (cuando prod), `sameSite`, pero no `path: '/'` (default OK), no `domain` (OK) y no se firma con `cookie-parser`.
- **Evidencia:** `backend/src/controller/auth.ts:28-35`.
- **Impacto:** bajo — el token JWT ya autentica por sí mismo, la firma de cookie aporta poco.

### 14. [BAJO] Swagger UI expuesto sin auth en `/api-docs`

- **Descripción:** la documentación de la API está pública.
- **Evidencia:** `backend/src/index.ts:84`.
- **Impacto:** facilita reconocimiento al atacante. Aceptable si el proyecto es realmente público; si es interno, conviene proteger con basic-auth o IP allowlist.

## Recomendaciones

Prioridad 1 (CRÍTICO — antes de prod):

1. **Validar firma del webhook MercadoPago.** Reemplazar `webhooks.ts` por:

   ```ts
   import crypto from "crypto";
   router.post("/mercadopago", express.raw({ type: "application/json" }), async (req, res) => {
     const signature = req.header("x-signature") ?? "";
     const requestId = req.header("x-request-id") ?? "";
     const dataId = req.query["data.id"] as string;
     const ts = signature.split(",").find(p => p.startsWith("ts="))?.slice(3);
     const v1 = signature.split(",").find(p => p.startsWith("v1="))?.slice(3);
     const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
     const expected = crypto.createHmac("sha256", process.env.MP_WEBHOOK_SECRET!)
       .update(manifest).digest("hex");
     if (expected !== v1) return res.sendStatus(401);
     // ... parsear req.body y procesar
   });
   ```

   Con el secret de la sección "Webhooks" en el panel de MercadoPago.

2. **Quitar el bypass total de CORS en development.** Mantener la lista explícita de orígenes para los tres modos:

   ```ts
   const devOrigins = ["http://localhost:5173", "http://localhost:5174"];
   const allowed = isDevelopment ? devOrigins : prodOrigins;
   origin: (origin, cb) => allowed.includes(origin) || !origin
     ? cb(null, true) : cb(new Error("CORS"));
   ```

3. **Borrar passwords del repo.** Mover `usersData` a un script que lea de `.env` (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) o que genere passwords random y las imprima una sola vez. Rotar las credenciales actuales YA, asumiéndolas comprometidas.

Prioridad 2 (ALTO):

4. **Helmet + rate limiting + body limits.**

   ```ts
   import helmet from "helmet";
   import rateLimit from "express-rate-limit";
   app.use(helmet());
   app.use(express.json({ limit: "64kb" }));
   const authLimiter = rateLimit({ windowMs: 15 * 60_000, max: 10, standardHeaders: true });
   app.use("/auth/login", authLimiter);
   app.use("/auth/register", authLimiter);
   app.use("/auth/google/login", authLimiter);
   ```

5. **Validar magic bytes de imágenes.** Usar `file-type` (npm) en `imageFileFilter` o aplicar siempre `sharp().metadata()` antes del upload (incluido `/checkout/transfer`). Generar `originalname` propio con UUID en vez de usar el del cliente.

6. **Fail-fast en envs críticas.** Centralizar lectura de env con Zod:

   ```ts
   const env = z.object({
     JWT_SECRET: z.string().min(32),
     DATABASE_URL: z.string().url(),
     MP_ACCESS_TOKEN: z.string().min(1),
     MP_WEBHOOK_SECRET: z.string().min(1),
     GOOGLE_CLIENT_ID: z.string().min(1),
     NODE_ENV: z.enum(["development", "test", "production"]),
   }).parse(process.env);
   ```

   Eliminar todos los `|| "default"` fallbacks.

Prioridad 3 (MEDIO):

7. **Forzar SSL en Postgres en producción**: `postgres(url, { prepare: false, ssl: isProd ? "require" : undefined })`.
8. **Dockerfile productivo separado** con `USER node`, `bun install --production`, sin `--watch`, multi-stage para no copiar `node_modules` de dev.
9. **Errores en cliente sólo verbosos en `NODE_ENV === "development"`** (whitelist), no por exclusión de producción.

## Referencias

- OWASP Top 10 (2021): A01 Broken Access Control, A02 Cryptographic Failures, A05 Security Misconfiguration.
- OWASP Cheat Sheet: [Webhook Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html), [File Upload](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html).
- MercadoPago: [Validación de firma de webhooks](https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks#editor_2).
- Helmet: <https://helmetjs.github.io/>
- express-rate-limit: <https://express-rate-limit.mintlify.app/>
- Drizzle ORM: <https://orm.drizzle.team/docs/sql>
