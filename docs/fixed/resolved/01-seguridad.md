# Issues resueltos de Seguridad

> Espejo de [`01-seguridad.md`](../improvements/01-seguridad.md) — issues resueltos.

---

### ✅ [CRÍTICO] JWT_SECRET centralizado con validación Zod

**Issue original**: Issue #2 — fallbacks hardcoded de `JWT_SECRET` ("your-secret-key", "your_jwt_secret_key") en 3 archivos.

**Solución**: Creado `backend/src/config/env.ts` con schema Zod. `JWT_SECRET` es requerido y validado al boot (fail-fast). Eliminados los 3 fallbacks y llamadas redundantes a `dotenv.config()`.

**Archivos**: `backend/src/config/env.ts` (NUEVO), `backend/src/middleware/auth.ts`, `backend/src/controller/auth.ts`, `backend/src/controller/google.ts`, `backend/src/db.ts`, `backend/src/index.ts`.

---

### ✅ [CRÍTICO] Passwords admin removidas de seeds

**Issue original**: Issue #4 — credenciales reales de admin en texto plano en `backend/src/seeds/data/user.ts`.

**Solución**: El usuario resolvió directamente. Ya no hay passwords hardcoded en seeds.

**Archivos**: `backend/src/seeds/data/user.ts`.

---

### ✅ [CRÍTICO] CORS: eliminado bypass de desarrollo con wildcard

**Issue original**: Issue #6 — `if (isDevelopment) return callback(null, true)` permitía cualquier origen con credentials.

**Solución**: Eliminado el bypass y la variable `isDevelopment`. Agregada `"https://estudio-glow.onrender.com"` a `allowedOrigins`. La whitelist de localhosts cubre desarrollo.

**Archivos**: `backend/src/index.ts`.
