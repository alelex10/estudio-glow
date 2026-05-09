# 2. Auth y Authorization

> Auditoría específica de autenticación y RBAC. Para problemas transversales (CORS, helmet, webhook, uploads) ver [`01-seguridad.md`](./01-seguridad.md).

## Estado actual

### Autenticación

- JWT firmado con HS256 (default de `jsonwebtoken`), payload `{ id, email, role }`, `expiresIn: "7d"`.
  - `backend/src/controller/auth.ts:92,140-144` (register, login).
  - `backend/src/controller/google.ts:98-102,212-216,339-343` (google flows).
- Verificación: `jwt.verify(token, JWT_SECRET)` sin restringir `algorithms`.
  - `backend/src/middleware/auth.ts:43`.
- Token leído primero de cookie `token`, fallback a header `Authorization: Bearer`.
  - `backend/src/middleware/auth.ts:29-36`.
- Cookie con `httpOnly: true`, `secure: NODE_ENV === "production"`, `sameSite: "none"|"lax"`, `maxAge: 15min` (login local, ver discrepancia abajo).
  - `backend/src/controller/auth.ts:28-35` — **15 min** (`TOKEN_MAX_AGE = 15 * 60 * 1000`).
  - `backend/src/controller/google.ts:17,104-109,169-174,218-223,345-350` — **7 días** (`TOKEN_MAX_AGE = 7 * 24 * 3600000`).
- Logout: `res.clearCookie("token")` sin opciones (`path`, `sameSite`, `secure`).
  - `backend/src/controller/auth.ts:160-163`.
- Password hashing: `bcrypt.genSalt(10)` + `bcrypt.hash`. Política mínima: `password: z.string().min(6)`.
  - `backend/src/controller/auth.ts:77-78`, `backend/src/schemas/auth.ts:16`.
- JWT secret con fallback `"your-secret-key"` / `"your_jwt_secret_key"` si la env no está.
  - `backend/src/middleware/auth.ts:8`, `backend/src/controller/auth.ts:21`, `backend/src/controller/google.ts:16`.
- Login local (`backend/src/controller/auth.ts:108-158`): se firma el JWT con `process.env.JWT_SECRET!` (sin fallback) — inconsistente con el resto del codebase.
- Google OAuth: `googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID })` — la librería `google-auth-library` valida `iss`, `aud`, `exp` y firma. ✓
  - `backend/src/controller/google.ts:21-38`.

### Autorización (RBAC)

- Dos roles en BD: `"admin"` y `"customer"`.
- Middlewares: `authenticate`, `requireAdmin`, `requireCustomer`.
  - `backend/src/middleware/auth.ts:28-69`.
- Aplicación por router:
  - `backend/src/routes/products.ts` — admin en `POST/PUT/DELETE`. ✓
  - `backend/src/routes/categories.ts` — admin en `POST/PUT/DELETE`. ✓
  - `backend/src/routes/orders.ts` — admin en TODAS las rutas (es `/orders` admin, mientras `/users/orders` es de cada usuario). ✓
  - `backend/src/routes/users.ts` — `authenticate` y luego controllers chequean ownership en `getUserOrderById`. ✓
  - `backend/src/routes/cart.ts` — `authenticate` global. ✓
  - `backend/src/routes/favorites.ts` — `authenticate` global. ✓
  - `backend/src/routes/checkout.ts` — `authenticate` global. ✓
  - **`backend/src/routes/dashboard.ts:7` — sólo `authenticate`, sin `requireAdmin`.** ✗
  - `backend/src/routes/webhooks.ts` — sin auth (correcto para webhook, pero ver problema 1 del informe de seguridad).
- Linking de cuenta Google ↔ Local: si llega un email ya existente en LOCAL y el usuario hace login con Google válido, se sobreescribe `provider` y `google_id`.
  - `backend/src/controller/google.ts:65-72,156-162,302-308`.

## Problemas detectados

### 1. [CRÍTICO] `JWT_SECRET` con fallback inseguro hardcoded

- **Descripción:** tres archivos hacen `process.env.JWT_SECRET || "your-secret-key"` (o variantes). Si la env no se setea en producción, el secret pasa a ser una cadena pública conocida del repo.
- **Evidencia:** `backend/src/middleware/auth.ts:8`, `backend/src/controller/auth.ts:21`, `backend/src/controller/google.ts:16`.
- **Impacto:** un atacante puede firmar tokens válidos con cualquier `id`/`role` y autenticarse como admin. **Game over** completo. Además la inconsistencia con `backend/src/controller/auth.ts:142` (`process.env.JWT_SECRET!` sin fallback en login) demuestra que el código no tiene un único punto de configuración: en algunos paths el booteo falla, en otros funciona con secret default.

### 2. [CRÍTICO] `/dashboard/stats` accesible para cualquier usuario autenticado

- **Descripción:** la ruta sólo aplica `authenticate`, sin `requireAdmin`. Cualquier customer logueado puede leer estadísticas de productos: total, stock bajo, sin stock, valor total del inventario.
- **Evidencia:** `backend/src/routes/dashboard.ts:7` vs. `backend/src/routes/orders.ts:12-17` (admin sí está protegido).
- **Impacto:** disclosure de datos comerciales (valor de inventario, conteos) a usuarios finales. Probablemente fue un olvido — `/orders/stats` sí pide admin y apunta al mismo controlador (`getProductStats`).

### 3. [ALTO] `jwt.verify` sin restringir `algorithms`

- **Descripción:** `jwt.verify(token, JWT_SECRET)` sin pasar `{ algorithms: ["HS256"] }`. La librería `jsonwebtoken` >= 9 ya rechaza `none` por default, pero NO rechaza confusión de algoritmo (un atacante con la public key podría intentar firmar con HS256 si el server espera RS256, etc.).
- **Evidencia:** `backend/src/middleware/auth.ts:43`.
- **Impacto:** mientras todo el flujo sea HS256 con el mismo secret, el riesgo es bajo. Pero si en algún momento se introduce un par de claves asimétricas (ej. para integraciones), hay vector de algorithm confusion. Best practice de seguridad: SIEMPRE fijar `algorithms`.

### 4. [ALTO] Account takeover vía Google linking automático

- **Descripción:** si existe un usuario LOCAL con email `victima@gmail.com`, cualquiera que controle ese email en Google puede hacer `/auth/google/login` o `/auth/google/register` y el sistema le **vincula** la cuenta automáticamente, sobreescribiendo `provider = "GOOGLE"` y poniendo el `google_id` del atacante.
- **Evidencia:** `backend/src/controller/google.ts:65-72` (en `googleAuth`), `:156-162` (en `googleRegister`), `:302-308` (en `googleLogin`).
- **Impacto:** si un atacante registra una cuenta de Google con el email de la víctima (posible si la víctima nunca lo activó como Google account, o vía typosquatting de Gmail con punto/+ aliases), gana acceso a la cuenta sin saber la password. Mitigación correcta: NO vincular automáticamente — pedir confirmación al usuario logueado, o requerir password local antes de linkear, o sólo linkear si `payload.email_verified === true` Y exigir step de confirmación.

  Adicionalmente, el código no chequea `payload.email_verified` (`backend/src/controller/google.ts:21-38`). En teoría Google sólo emite tokens con email verified = true para cuentas Workspace / Gmail, pero confirmar es trivial y elimina riesgo.

### 5. [ALTO] Política de password débil

- **Descripción:** `password: z.string().min(6)` permite passwords como `"123456"` o `"qwerty"`. Sin requisito de complejidad, longitud máxima ni chequeo contra password lists conocidas.
- **Evidencia:** `backend/src/schemas/auth.ts:16`.
- **Impacto:** facilita brute force (especialmente sin rate limiting — ver `01-seguridad.md` problema 4). NIST 800-63B recomienda min **8 caracteres**, idealmente longer; con bcrypt input limit de 72 bytes y check contra HIBP.

### 6. [ALTO] Token expira en 7 días sin refresh ni revocación

- **Descripción:** el JWT vive 7 días, no hay refresh token rotativo, no hay blacklist/revocation list. Logout sólo borra la cookie en el cliente — el token sigue válido si alguien lo capturó.
- **Evidencia:** `backend/src/controller/auth.ts:92,143`, `google.ts:101,167,215,343`. Logout: `auth.ts:160-163`.
- **Impacto:** si un token se filtra (XSS, log accidental, dispositivo robado), el atacante tiene 7 días de acceso completo. El "logout" no logoutea realmente. Mitigación: tokens de acceso cortos (15min como en `auth.ts` para login local) + refresh token httpOnly de larga duración con rotación, o agregar `jti` y blacklist en Redis/DB.

### 7. [ALTO] Inconsistencia de `maxAge` y de verificación de secret

- **Descripción:** `controller/auth.ts` define `TOKEN_MAX_AGE = 15min` mientras `controller/google.ts` define `TOKEN_MAX_AGE = 7 días`. Pero `expiresIn` del JWT en ambos es `"7d"`. La cookie expira en 15min (login local) pero el token sigue válido 7 días.
- **Evidencia:** `backend/src/controller/auth.ts:22,92`, `backend/src/controller/google.ts:17,101`.
- **Impacto:** confusión funcional + el login local re-pide auth cada 15min pero el token largo sigue siendo válido si se filtró. La duración de cookie y de token deben coincidir, y elegir DELIBERADAMENTE una política.

### 8. [MEDIO] Cookie de logout no replica las flags del set

- **Descripción:** `res.clearCookie("token")` sin opciones puede no borrar la cookie original que fue seteada con `sameSite: "none"; secure; httpOnly` — el browser borra solamente si las opciones coinciden.
- **Evidencia:** `backend/src/controller/auth.ts:161`.
- **Impacto:** la cookie puede persistir tras un "logout" en algunos browsers/proxies. Fix:

  ```ts
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  ```

### 9. [MEDIO] Email enumeration en register/login

- **Descripción:** `register` devuelve `409 ConflictError("El usuario con email ${email} ya existe")` revelando si el email ya está registrado. `login` distingue "Credenciales inválidas" vs. "Esta cuenta usa Google para iniciar sesión".
- **Evidencia:** `backend/src/controller/auth.ts:74,118-119,130-132`.
- **Impacto:** un atacante puede enumerar emails registrados antes de fuerza bruta o phishing. Combinado con falta de rate limit, es trivial. Fix: respuesta genérica en register ("Si el email no está usado, se creará la cuenta — revisá tu mail") + mensaje uniforme en login ("Credenciales inválidas") sin pista del provider.

### 10. [MEDIO] Mass assignment parcial en register

- **Descripción:** `RegisterSchema` incluye `role: z.enum(["admin", "customer"]).optional()` — el cliente puede mandar `"role": "admin"` en el body. El controller IGNORA el role enviado (hardcodea `userRole = "customer"`), pero el schema lo acepta y abre la puerta a confusión futura: si alguien refactoriza y hace `req.body` directo, tenemos privilege escalation.
- **Evidencia:** `backend/src/schemas/auth.ts:20-23` y `backend/src/controller/auth.ts:81`.
- **Impacto:** vulnerabilidad latente, no presente. La fix correcta es eliminar `role` del schema de registro público; admins se promueven por flujo separado.

### 11. [BAJO] No se valida `email_verified` del token de Google

- **Descripción:** ver problema 4. Riesgo bajo porque Google rara vez emite tokens con `email_verified: false`.
- **Evidencia:** `backend/src/controller/google.ts:26-38`.
- **Impacto:** defensa en profundidad ausente.

### 12. [BAJO] Falta protección CSRF para mutaciones con cookie

- **Descripción:** las cookies tienen `sameSite: "none"` en producción para permitir frontend en otro dominio (Vercel ↔ Render). `sameSite=none` desactiva la protección CSRF nativa, y no se implementa double-submit token ni `Origin`/`Referer` check explícito.
- **Evidencia:** `backend/src/controller/auth.ts:33`.
- **Impacto:** un sitio malicioso podría intentar requests cross-origin con la cookie del usuario. Está mitigado por CORS allowlist (en producción), pero la defensa en profundidad recomienda CSRF token o usar `Authorization: Bearer` con storage seguro y descartar la cookie cross-site.

## Recomendaciones

Prioridad 1 (CRÍTICO):

1. **Centralizar y validar `JWT_SECRET` con fail-fast.** Crear `src/config/env.ts`:

   ```ts
   import { z } from "zod";
   const envSchema = z.object({
     JWT_SECRET: z.string().min(32, "JWT_SECRET must be ≥32 chars"),
     GOOGLE_CLIENT_ID: z.string().min(1),
     NODE_ENV: z.enum(["development", "test", "production"]),
   });
   export const env = envSchema.parse(process.env);
   ```

   Importar `env.JWT_SECRET` en todos lados; eliminar TODOS los `|| "..."` fallbacks. Generar un secret seguro con `openssl rand -hex 64` para cada ambiente.

2. **Proteger `/dashboard/stats` con `requireAdmin`:**

   ```ts
   // backend/src/routes/dashboard.ts
   router.get("/stats", authenticate, requireAdmin, getProductStats);
   ```

Prioridad 2 (ALTO):

3. **Fijar algoritmo en `jwt.verify`:**

   ```ts
   jwt.verify(token, env.JWT_SECRET, { algorithms: ["HS256"] });
   ```

4. **Eliminar el linking automático Google ↔ Local.** Si llega un Google login con email que existe en LOCAL: rechazar con mensaje "Esta cuenta usa email/password. Iniciá sesión con tu password y vinculá Google desde tu perfil." Implementar el flujo de linking explícito DESDE el perfil, requiriendo password actual.

5. **Subir mínimo de password a 8, agregar máximo de 72 (bcrypt limit), opcionalmente chequear contra HIBP / lista común:**

   ```ts
   password: z.string().min(8).max(72)
     .refine(p => !/^(password|123456|qwerty)/i.test(p), "Password muy común")
   ```

6. **Tokens cortos + refresh con rotación.** Access token 15min en cookie httpOnly, refresh token 7 días en cookie httpOnly distinta path-scoped a `/auth/refresh`, rotar en cada refresh, persistir `jti` en DB para revocar en logout.

7. **Logout server-side completo:** clearCookie con flags coincidentes + invalidar refresh token en DB.

Prioridad 3 (MEDIO):

8. **Quitar `role` del `RegisterSchema`.** Crear endpoint admin separado para promover.
9. **Mensajes uniformes en register/login** para evitar enumeration.
10. **Validar `payload.email_verified === true`** en Google.

## Referencias

- OWASP Top 10: A01 Broken Access Control, A07 Identification and Authentication Failures.
- OWASP ASVS V2 Authentication, V3 Session Management, V4 Access Control.
- OWASP Cheat Sheet [JSON Web Token for Java](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html) (aplica conceptual a Node).
- NIST 800-63B Digital Identity Guidelines.
- RFC 8725 [JSON Web Token Best Current Practices](https://datatracker.ietf.org/doc/html/rfc8725).
- Google [Verifying ID tokens](https://developers.google.com/identity/sign-in/web/backend-auth).
- HIBP password API: <https://haveibeenpwned.com/API/v3#PwnedPasswords>
