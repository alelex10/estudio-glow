# Issues resueltos de Auth y Authorization

> Espejo de [`02-auth-authorization.md`](../improvements/02-auth-authorization.md) — issues resueltos.

---

### ✅ [CRÍTICO] `/dashboard/stats` protegido con `requireAdmin`

**Issue original**: Issue #2 (original) / #9 (ejecutivo) — ruta `/dashboard/stats` solo tenía `authenticate`, sin `requireAdmin`. Cualquier customer autenticado podía leer stats de inventario.

**Solución**: Agregado `requireAdmin` al import y a la ruta. Mismo patrón que `routes/orders.ts` y `routes/products.ts`.

**Archivos**: `backend/src/routes/dashboard.ts`.

---

### ✅ [ALTO] Cookie maxAge unificado entre auth.ts y google.ts

**Issue original**: Issue #7 (original) — `auth.ts` definía `TOKEN_MAX_AGE = 15min` mientras `google.ts` usaba `7 días`. El JWT se firmaba con `expiresIn: "7d"` en ambos, pero la cookie de auth.ts expiraba a los 15 minutos, dejando una cookie muerta con un token vivo.

**Solución**: Cambiado `auth.ts` de `15 * 60 * 1000` a `7 * 24 * 3600000` para coincidir con `google.ts` y con `expiresIn: "7d"` del JWT.

**Archivos**: `backend/src/controller/auth.ts`.
