# 05 — Seguridad (prioridad baja)

> **ESTADO ACTUAL (2026-05-17):** ✅ Issues 5.4 (trust proxy), 5.5 (silent merge Google), 5.7 (race condition Google), 5.9 (logs Postgres) **RESUELTOS**. Issues 5.1–5.3, 5.6, 5.8 siguen en **backlog P3** (depriorizados por el usuario).

**Prioridad:** P3 — bajada explícitamente por el usuario: "cosas de seguridad muy sarpadas no lo tengas mucho en cuenta porque no es la gran cosa la web".

Este archivo queda como **registro** de los hallazgos detectados para revisarlos cuando la web crezca o cambien las prioridades. No son P0 hoy.

---

## 5.1 CSRF roto end-to-end 🟡 (P3)

**Archivos:**
- `backend/src/middleware/csrf.ts:33-40` — defensa solo por `X-Requested-With`.
- `frontend/app/common/config/api-client.ts:29-69` — nunca inyecta el token.

**Problema combinado:**
- Backend espera un header / token; bypasseable con CORS mal configurado o endpoint que acepte `form-urlencoded`.
- Frontend manda `credentials: 'include'` pero NUNCA agrega `X-CSRF-Token`.

**Cuándo importará:** cuando crezca la base de usuarios o si alguien hace targeting específico. Para una web chica de bajo perfil, baja probabilidad.

**Fix futuro:**
1. Backend: double-submit cookie con `crypto.randomBytes(32)` + `timingSafeEqual`. Emitir cookie `XSRF-TOKEN` no-HttpOnly y exigir header `X-CSRF-Token` que matchee.
2. Frontend: en `api-client.ts` agregar interceptor:
   ```ts
   if (method !== 'GET') {
     headers['X-CSRF-Token'] = getCookie('XSRF-TOKEN');
   }
   ```

**Estado:** ⬜ backlog

---

## 5.2 CORS reflexivo en requests sin Origin 🟡 (P3)

**Archivo:** `backend/src/index.ts:53-58`

**Problema:** `if (!origin) return callback(null, true)` + `credentials: true` → herramientas server-side con cookie robada actúan sin filtro. Requiere que la cookie ya esté comprometida.

**Fix futuro:** en producción, exigir `origin` presente y dentro de allowlist. `callback(null, false)` cuando falte.

**Estado:** ⬜ backlog

---

## 5.3 JWT devuelto en JSON además de cookie HttpOnly 🟡 (P3)

**Archivos:**
- `backend/src/controller/auth.ts:162`
- `backend/src/controller/google.ts:159-201, 259-270`

**Problema:** `res.status(200).json({ ...response, token })` expone el JWT en el body. Si hubiera XSS en el frontend, el token es legible y anula el `httpOnly: true` de la cookie.

**Fix futuro:** NO devolver `token` en el body. La cookie ya viaja automáticamente con `credentials: include`.

**Estado:** ⬜ backlog

---

## 5.4 Sin `trust proxy` en Express 🟡 (P3)

**Archivo:** `backend/src/index.ts`

**Problema:** detrás de Render/Vercel/proxy, `req.ip` retorna la IP del proxy a menos que `app.set('trust proxy', 1)` esté configurado. Resultado: rate-limit por IP throttlea a TODOS los usuarios (comparten la IP del edge).

**Fix futuro (una línea):**
```ts
app.set('trust proxy', 1);
```

**Nota:** **este sí vale arreglarlo aunque sea P3** — es una sola línea con alto impacto operacional. Lo dejo acá por categoría pero conviene tratarlo como P1 si en algún momento se reportan bloqueos masivos por rate-limit.

**Estado:** ✅ resuelto — `app.set('trust proxy', 1)` añadido en `index.ts` antes de los middlewares. `req.ip` ahora refleja la IP real del cliente a través de Render/Vercel.

---

## 5.5 Silent merge en Google sin purgar `password_hash` 🟡 (P3)

**Archivo:** `backend/src/controller/google.ts:177-203` (caso C3a)

**Problema:** si alguien registró con email ajeno y nunca verificó, y después la víctima loguea con Google → silent merge marca `email_verified=true` pero deja el `password_hash` del atacante intacto. El atacante puede seguir entrando con su password después del merge.

**Fix futuro:** en el merge, `UPDATE users SET password_hash = NULL` (o forzar reset).

**Estado:** ✅ resuelto — `UserRepository.linkGoogle` ahora incluye `password_hash: null` en el UPDATE (junto con `google_id` y `email_verified: true`). El caso C3a en `AuthService.resolveGoogleIdentity` usa `linkGoogle` exclusivamente.

---

## 5.6 `sameSite: "none"` en prod sin defensa adicional 🟡 (P3)

**Archivo:** `backend/src/controller/auth.ts:34`

**Problema:** `sameSite: "none"` debilita la protección CSRF nativa del navegador. Combinado con #5.1 (CSRF mal hecho), no queda defensa.

**Fix futuro:** si frontend y backend están en mismo eTLD+1, usar `sameSite: "lax"` o `"strict"` también en prod.

**Estado:** ⬜ backlog

---

## 5.7 Race condition en creación de usuario Google 🟢 (P3, mitigable trivialmente)

**Archivo:** `backend/src/controller/google.ts:230-247`

**Problema:** dos peticiones simultáneas con el mismo Google idToken pueden pasar ambos lookups (por googleId y por email) y crear dos usuarios.

**Fix:** UNIQUE constraint en `users.google_id`. **Verificar si ya existe** en el modelo (si está, este punto se cierra).

**Estado:** ✅ resuelto — verificado. `models/user.ts` línea 10 ya tiene `.unique()` en `google_id`. La migración `0002_strange_zaran.sql` aplica `ALTER TABLE "user" ADD CONSTRAINT "user_google_id_unique" UNIQUE("google_id")`. No se requería nueva migración.

---

## 5.8 `SEED_DEFAULT_PASSWORD` default débil 🟢 (P3)

**Archivos:**
- `backend/.env.example`
- `backend/src/config/env.ts:26`

**Problema:** default `"change-me-in-dev"` permite acceso a cuentas seed si alguien deploya con seeds en prod por error.

**Fix futuro:** Zod refinement que rechace este default cuando `NODE_ENV === 'production'`.

**Estado:** ⬜ backlog

---

## 5.9 Logs exponen detalles internos de Postgres 🟢 (P3)

**Archivo:** `backend/src/middleware/error-handler.ts:32-57`

**Problema:** `console.error` registra `cause.detail`, `cause.table`, `cause.column`, `cause.constraint`. En errores de UNIQUE violation, `cause.detail` puede contener: `"Key (email)=(user@example.com) already exists"` → PII en logs.

**Fix futuro:** ver #4.5 (migrar a `logger` pino con redacción).

**Estado:** ⬜ backlog

---

## Resumen — qué SÍ vale hacer pese a la baja prioridad

| # | Item | Razón |
|---|------|-------|
| 5.4 | `app.set('trust proxy', 1)` | Una línea, evita bloqueos masivos de usuarios legítimos por el rate-limit |
| 5.7 | Verificar UNIQUE en `users.google_id` | Si no está, es trivial agregarlo y previene duplicación accidental |
| 5.9 | (Cubierto por #4.5) | PII en logs es un riesgo si los logs van a un proveedor externo (Sentry, Logtail) |

El resto del archivo queda como **backlog formal** para cuando cambien las prioridades.
