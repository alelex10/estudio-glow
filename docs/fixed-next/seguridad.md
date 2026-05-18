# Backlog de Seguridad — Estudio Glow

> **Prioridad: P3 / Backlog explícito**
>
> El usuario depriorizó estos items con la instrucción: *"cosas de seguridad muy sarpadas no lo tengas mucho en cuenta porque no es la gran cosa la web"*.
> Se mantienen documentados para cuando la base de usuarios o el perfil de riesgo cambie, pero **no deben bloquear releases ni sprints inmediatos**.
>
> Fecha de consolidación: 2026-05-17.
> Incluye items pendientes de `fixed-3/05-seguridad.md` (5.1, 5.2, 5.3, 5.6, 5.8) más `fixed-3/03-frontend-ux.md` 3.12.

---

## 1. CSRF roto end-to-end (5.1)

**Severidad:** Medium (baja probabilidad para perfil actual)

**Archivos:**
- `backend/src/middleware/csrf.ts:33-40`
- `frontend/app/common/config/api-client.ts:29-69`

**Descripción:**
El backend espera defensa CSRF (custom header `X-Requested-With`), pero el frontend nunca inyecta un token CSRF real. `api-client.ts` solo envía `credentials: 'include'`. La estrategia actual es bypassable si hay CORS mal configurado o endpoints que acepten `form-urlencoded`. Aunque la web es de bajo perfil, si el backend ya tiene el middleware activo, en algún momento un flujo legítimo puede chocar con `CSRF_FAILED`.

**Fix futuro:**
1. Backend: double-submit cookie con `crypto.randomBytes(32)` + `timingSafeEqual`. Emitir cookie `XSRF-TOKEN` (no HttpOnly) y exigir header `X-CSRF-Token`.
2. Frontend: interceptor en `api-client.ts` que lea `XSRF-TOKEN` y lo envíe en requests mutantes.

---

## 2. CORS reflexivo en requests sin Origin (5.2)

**Severidad:** Low–Medium

**Archivo:** `backend/src/index.ts:53-58`

**Descripción:**
`if (!origin) return callback(null, true)` combinado con `credentials: true` permite que herramientas server-side (ej. curl, Postman, scripts automatizados) envíen la cookie de sesión sin filtro de origin. Requiere que la cookie ya esté comprometida, pero expande la superficie de ataque.

**Fix futuro:**
En producción, rechazar requests sin `Origin` explícito: `callback(null, false)` cuando falte el header, salvo para un allowlist de IPs/tooling interno.

---

## 3. JWT devuelto en JSON además de cookie HttpOnly (5.3)

**Severidad:** Low–Medium

**Archivos:**
- `backend/src/controller/auth.ts:162`
- `backend/src/controller/google.ts:159-201, 259-270`

**Descripción:**
Las respuestas de login/register incluyen el JWT en el body JSON (`{ token }`). La cookie ya viaja automáticamente con `credentials: include`. Si en algún momento el frontend sufre XSS, el token en body es legible vía `response.json()`, anulando la protección `httpOnly: true` de la cookie.

**Fix futuro:**
Eliminar `token` del body de respuesta en todos los endpoints de autenticación. El cliente debe confiar en la cookie HttpOnly.

---

## 4. `sameSite: "none"` en producción sin defensa adicional (5.6)

**Severidad:** Low–Medium

**Archivo:** `backend/src/controller/auth.ts:34`

**Descripción:**
La cookie `token` usa `sameSite: "none"` en producción. Esto desactiva la protección CSRF nativa del navegador. Combinado con #5.1 (CSRF mal implementado), no queda defensa en profundidad contra cross-site requests.

**Fix futuro:**
Si frontend y backend comparten el mismo eTLD+1 (o se configura explícitamente), usar `sameSite: "lax"` o `"strict"` también en producción.

---

## 5. `SEED_DEFAULT_PASSWORD` default débil (5.8)

**Severidad:** Low

**Archivos:**
- `backend/.env.example`
- `backend/src/config/env.ts:26`

**Descripción:**
El default de `SEED_DEFAULT_PASSWORD` es `"change-me-in-dev"`. Si alguien despliega con `NODE_ENV=production` y ejecuta seeds por error, las cuentas seed quedan accesibles con una contraseña trivial.

**Fix futuro:**
Agregar refinement de Zod en `env.ts` que rechace este valor exacto cuando `NODE_ENV === 'production'`.

---

## 6. Frontend NO envía CSRF token (3.12)

**Severidad:** Medium (P3)

**Archivo:** `frontend/app/common/config/api-client.ts:29-69`

**Descripción:**
`api-client.ts` envía `credentials: 'include'` pero nunca lee ni inyecta un CSRF token. El backend tiene `CSRF_ERROR` mapeado, lo que significa que en algún escenario (endpoint que no acepte `X-Requested-With`, configuración futura estricta) las llamadas autenticadas fallarán silenciosamente o con 403 confuso.

**Relación con 5.1:**
Es la cara frontend del mismo problema. Se agrupa aquí para tratarlo de forma unificada si en algún momento se prioriza.

**Fix futuro:**
Ver sección 5.1 (double-submit cookie + interceptor).

---

## Notas de contexto

- **5.4 (trust proxy)**, **5.5 (silent merge Google)**, **5.7 (race condition Google UNIQUE)** y **5.9 (logs Postgres PII)** fueron resueltos en el refactor reciente y ya no aplican.
- Si en algún momento se habilita MercadoPago en UI masivamente o se expone la app a público de alto perfil, se recomienda promover **5.1 / 3.12** de P3 a P1.
