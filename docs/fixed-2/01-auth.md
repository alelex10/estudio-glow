# Authentication Audit — User Perspective

> **ESTADO ACTUAL (2026-05-17):** ✅ Parcialmente resuelto. CSRF helpers fixed, email verification implementado. ❌ Pendientes críticos: sesión 15 min (#1), account-linking UI inexistente (#3), Google 409 mapping roto (#4), password reset ausente (#5).

## Overview

Glow Studio implements a dual authentication system: email/password (local) and Google OAuth (Google Identity Services / "One Tap"). Sessions are persisted via two parallel mechanisms — an HTTP-only JWT cookie set by the backend (`token`, 7-day lifetime) and a React Router server-side cookie session (`__session`, **15-minute lifetime**) holding token + user + role. No password reset, no email verification, no account-linking UI. Auth endpoints are CSRF-protected by a custom-header strategy and globally rate-limited at 10 req/min/IP.

Code reviewed (paths excluded `/docs/fixed`):
- Backend: `backend/src/routes/auth.ts`, `backend/src/controller/auth.ts`, `backend/src/controller/google.ts`, `backend/src/middleware/{auth,csrf,rate-limit}.ts`, `backend/src/schemas/auth.ts`.
- Frontend: `frontend/app/routes/auth/{login,register}.tsx`, `frontend/app/actions/auth/{register-action,logout}.tsx`, `frontend/app/common/services/{auth.server,authApi.server,session-storage}.ts`, `frontend/app/common/components/button/GoogleLoginButton.tsx`, `frontend/app/common/components/nav-bar/UserActions.tsx`.

---

## User Journeys

### 1. Register (email/password)

**Exists?** Yes. Route `/auth/register` (`frontend/app/routes/auth/register.tsx`), backed by action `/actions/auth/register-action` (`frontend/app/actions/auth/register-action.tsx:14`). Backend `POST /auth/register` (`backend/src/controller/auth.ts:62`).

**Flow:**
1. User navigates to `/auth/register`. The loader (`register.tsx:28`) redirects authenticated users to home/admin.
2. User fills name, email, password, confirmPassword. Client validation by `registerSchema` (`frontend/app/common/schemas/auth.ts:10`) requires name ≥ 2, valid email, password ≥ 6, and matching `confirmPassword`.
3. On submit, the form is intercepted by `react-hook-form` and re-submitted natively to `/actions/auth/register-action` (`register.tsx:155`).
4. The action calls `serverRegister` → `POST {API}/auth/register` (`authApi.server.ts:35`).
5. Backend checks duplicate email (`auth.ts:67`), hashes password with bcrypt salt-10, inserts user with role `customer`, signs JWT 7-day, sets `token` cookie, returns `{message, user, token}` (status 201).
6. Frontend stores token+user+role in the React Router session and `redirect(ROUTES.HOME)` (`auth.server.ts:48`).

**What works:** Happy-path local registration, password hashing with bcrypt, duplicate-email rejection with clear message, redirect of already-authenticated users.

**Broken / poor UX:**
- The register form (`register.tsx:184–191`) renders a `confirmPassword` field, but the action handler (`register-action.tsx:18`) parses only `name, email, password`. **`confirmPassword` is checked only client-side.** A user who disables JS or submits via the underlying native form bypasses the match check — server accepts the request. The backend `RegisterSchema` (`schemas/auth.ts:6`) has no `confirmPassword`. Severity: low (defense-in-depth, no real exploit).
- Backend `RegisterSchema` accepts an optional `role` field (`backend/src/schemas/auth.ts:20`). The controller (`auth.ts:80`) hardcodes `userRole = "customer"` and ignores the body field, so this is currently safe — but the schema is misleading and could become a privilege-escalation footgun if a future refactor wires the body value through.
- Error messages bubble up as `actionData.error` (`register.tsx:73`) showing the raw backend message. There is no field-level error mapping — a 409 conflict shows "El usuario con email X ya existe" as a generic banner, not on the email field.

### 2. Login (email/password)

**Exists?** Yes. Route `/login` (`frontend/app/routes/auth/login.tsx`). Backend `POST /auth/login` (`backend/src/controller/auth.ts:107`).

**Flow:** Identical structure to register. Frontend `loginSchema` requires email + password ≥ 6. Backend looks up by email, blocks login if `password_hash` is null with the message "Esta cuenta usa Google para iniciar sesión. Usá el botón de Google." (`auth.ts:128`), bcrypt-compares, signs JWT, sets cookie, returns response. Login action processes both Google idToken and email/password in the same handler (`login.tsx:44`).

**What works:** Bcrypt password verification, helpful error when a Google-only user tries password login, redirect to admin/home by role, "registrate" suggestion link rendered when the Google login surfaces `NOT_REGISTERED` (`login.tsx:189`).

**Broken / poor UX:**
- The "no existe una cuenta con este email" message (`auth.ts:118`) is a **user-enumeration oracle** — the response distinguishes "email not found" from "wrong password" ("Credenciales inválidas"). For an e-commerce app this leaks which emails are registered. Severity: medium.
- There is no "forgot my password" link anywhere in the login page. A user who forgets their password is permanently locked out of their LOCAL account.
- No "show password" toggle on either form.
- The login form does the same `e?.target.submit()` trick (`login.tsx:165`) to bypass `react-hook-form` and re-submit natively. If the browser ever rejects the synthetic submit (some password managers do), validation will run but submission will not — silent failure.

### 3. Google OAuth — Register

**Exists?** Yes. Backend `POST /auth/google/register` (`backend/src/controller/google.ts:122`). Frontend handled inside `frontend/app/routes/auth/register.tsx:40` via `serverGoogleRegister` (inlined, not from `authApi.server.ts`).

**Flow:**
1. `GoogleLoginButton` (`GoogleLoginButton.tsx:23`) loads `https://accounts.google.com/gsi/client`, calls `google.accounts.id.initialize({client_id})` and renders the official Google button.
2. On consent, Google returns an idToken to the JS callback; the component fires `onSuccess(idToken)`.
3. The handler attaches `idToken` to a FormData and `submit()`s the register route.
4. Backend verifies the idToken with `OAuth2Client.verifyIdToken` (`google.ts:18`), checks for existing googleId, existing email (rejects if LOCAL → "vinculá Google desde tu perfil"), then creates a `GOOGLE` user, sets cookie, returns 201.

**What works:** Google idToken verification against Google's keys, googleId conflict detection, deliberate refusal to auto-link LOCAL accounts (CWE-863 prevention is annotated in code — `google.ts:153`).

**Broken / poor UX:**
- The 409 message tells users to "vinculá Google desde tu perfil" — but **there is no profile page and no account-linking flow** anywhere in the codebase (no route, no endpoint). The user is told to do something they cannot do. Severity: high.
- The Google button is rendered through Google's iframe inside a `div ref`. Width is read once from `buttonRef.current.offsetWidth` (`GoogleLoginButton.tsx:64`). If the container has 0 width at first paint (modal animation, layout shift), the button renders with width 0 and never re-renders.
- If `VITE_GOOGLE_CLIENT_ID` is missing, a disabled fallback button reading "Google (no configurado)" is shown (`GoogleLoginButton.tsx:99`). Users see this only after the form has already loaded; there is no upstream config check.
- `register.tsx:40` defines a private `serverGoogleRegister` that duplicates the pattern in `authApi.server.ts` instead of consolidating. The duplicated version does NOT map error codes (`NOT_REGISTERED`, `UPSTREAM_UNAVAILABLE`, etc.) — all errors collapse into the raw message.

### 4. Google OAuth — Login

**Exists?** Yes. Backend `POST /auth/google/login` (`backend/src/controller/google.ts:210`). Frontend in `login.tsx:48`.

**Flow:** Same idToken acquisition. The action checks for `idToken` first (`login.tsx:48`); if present, calls `serverGoogleLogin`. The backend looks up by googleId, then by email; if the email matches a LOCAL account, returns 409 with "iniciá sesión con tu contraseña y vinculá Google"; if no user, returns 401 "Usuario no registrado. Por favor, registrate primero con Google."

**What works:** Heavy structured logging at every decision branch (`google.ts:217, 228, 246, 264, 280` etc.) is great for debugging. Error mapping in `serverGoogleLogin` (`authApi.server.ts:95`) classifies 401 as `NOT_REGISTERED` and renders a "Ir a registro" link in the UI (`login.tsx:189`).

**Broken / poor UX:**
- The error-code classifier (`authApi.server.ts:95`) uses status code AND a substring match (`errorMessage.includes("no registrado")`). The 409 LOCAL-account conflict has status 409 and message starts with "Ya existe una cuenta…". This falls through into `code = "UNKNOWN"` and the UI surfaces only the default "Error al iniciar sesión con Google. Por favor, intentá más tarde." (`login.tsx:64`). **The user is told to try later when in fact they need to log in with their password.** Severity: high.
- The deprecated `POST /auth/google` endpoint (`google.ts:37`) is still registered (`routes/auth.ts:12`) and returns `Warning: 299` but is otherwise live. Dead code path; risk of being called by stale clients.

### 5. Logout

**Exists?** Yes. Frontend action `/actions/auth/logout` (`frontend/app/actions/auth/logout.tsx:5`). Backend `POST /auth/logout` (`backend/src/controller/auth.ts:159`).

**Flow:**
1. User clicks the LogOut icon in `UserActions.tsx:26` — a `<Form method="post" action={ROUTES.actions.AUTH_LOGOUT}>` with a single icon button.
2. Frontend action calls `logout()` via `apiClient` (`authApi.server.ts:60`) — which fires `POST /auth/logout` with `X-Requested-With: XMLHttpRequest`. Errors are swallowed (`logout.tsx:8`).
3. Backend calls `res.clearCookie("token")` and returns 200.
4. Frontend destroys its session cookie via `destroyAuthSession` and redirects to `/login`.

**What works:** Two-step cleanup (backend cookie + frontend session). Logout is forgiving — even if the backend is down, the frontend session is destroyed.

**Broken / poor UX:**
- The `apiClient` in `authApi.server.ts:60` is called from a **server-side action**, but reads cookies from `credentials: "include"` semantics that exist only in the browser. From server context, the `apiClient` `fetch` does not forward the user's `token` cookie. **The backend `POST /auth/logout` receives the request without a cookie**, so `clearCookie` runs on an already-absent session. Net effect: the cookie clearing is a no-op on the server; the frontend session destruction is what actually logs the user out. The backend JWT cookie on the browser is still cleared, but only because `clearCookie` returns a `Set-Cookie: token=; Max-Age=0` header that the browser applies. Severity: low (works by accident); but if a developer ever relies on backend invalidation (token blocklist, etc.) this will silently fail.
- The logout button is a single LogOut icon with no `aria-label` and no confirmation. Accidental clicks log the user out instantly.

### 6. Session persistence

**Exists?** Yes — two parallel mechanisms.

- Backend: `token` cookie, `httpOnly`, `sameSite: none` in prod (`auth.ts:32`), `maxAge: 7 days`.
- Frontend: `__session` cookie via `createCookieSessionStorage` (`session-storage.ts:7`), `httpOnly`, `sameSite: lax`, `maxAge: 15 minutes`.

**Problem (critical):** The frontend session cookie expires in **15 minutes** while the backend JWT is valid for 7 days. There is no refresh mechanism. After 15 minutes of inactivity:
- The browser still holds the backend `token` cookie (7-day life).
- `getUser(request)` returns null because `__session` is gone.
- `isAuthenticated(request)` returns false (`auth.server.ts:30` — checks the session token, not the backend cookie).
- The user is treated as logged out by every loader (`layout.tsx:17`, `requireAuth` in `auth-helpers.ts:13`).
- The login page redirects to home if `isAuthenticated`, but the user perceives themselves as still logged in (the `token` cookie is sent on direct API calls).

Net user experience: **active sessions die every 15 minutes**. The user must log in again repeatedly. Severity: critical from a UX standpoint.

The backend exposes `/auth/verify` (`controller/auth.ts:164`) and `api-end-points.ts:20` declares it, but **no frontend code calls it**. There is no token-refresh / silent-renew path.

### 7. CSRF

**Exists?** Yes. `csrfProtect` middleware (`backend/src/middleware/csrf.ts:20`) applied globally (`index.ts:86`). State-changing requests must carry `X-Requested-With: XMLHttpRequest`. Webhooks bypassed.

**What works:** The `apiClient` (`frontend/app/common/config/api-client.ts:23`) injects `X-Requested-With` automatically. Custom-header CSRF is a reasonable choice for an SPA.

**Broken:** The `authApi.server.ts` helpers (`serverLogin`, `serverRegister`, `serverGoogleLogin`) bypass `apiClient` and use raw `fetch` without `X-Requested-With`. They are called server-to-server, so the CSRF middleware would reject them — **except** the middleware is global and applied BEFORE the routes (`index.ts:86`). Tracing: `serverLogin` → `POST {API}/auth/login` → `csrfProtect` → no `X-Requested-With` → 403. **This should fail in production but the audit cannot run the app.** Either CSRF is broken for these flows, or these calls never hit the deployed API. Severity: critical if the audit reading is correct; needs runtime verification.

### 8. Rate limiting

**Exists?** Yes. `authLimiter` (`backend/src/middleware/rate-limit.ts:9`), 10 req/min/IP, applied to the entire `/auth` router (`index.ts:104`).

**What works:** Blocks brute-force. Returns a structured error message.

**Broken:** In-memory store (single-instance only — comment acknowledges this). Behind a proxy/load balancer, all requests share the proxy IP unless `trust proxy` is set; `index.ts` does not call `app.set("trust proxy", …)`, so every user on a Vercel preview is one bucket. Severity: medium in production.

### 9. Password reset

**Does not exist.** No route, no endpoint, no email service. Searched for `forgot`, `password.*reset`, `reset.*password`, `recover` — zero results in app code. Users who forget their password and are not on Google have no recovery path. Severity: high (real users will be permanently locked out).

### 10. Email verification

**Does not exist.** Registration immediately issues a session — no email confirmation. Anyone can create an account with any email. Severity: medium for an e-commerce app handling orders.

---

## What Works

- Local register/login with bcrypt hashing.
- Google idToken verification on the server (proper `audience` check).
- Explicit refusal to auto-link Google to an existing LOCAL email (CWE-863) — well annotated.
- Rate-limit middleware wired and meaningful response message.
- CSRF custom-header strategy correctly bypassed for safe methods and webhooks.
- Structured request-scoped logging on Google login (`google.ts:217–356`) is excellent for triage.
- Frontend uses `react-hook-form` + zod for live field validation with clear Spanish messages.
- Loaders on `/login` and `/auth/register` redirect already-authenticated users — no stale form states.
- Role-based redirect post-auth (admin → `/admin`, customer → `/`).

---

## Issues Found

### Critical

1. **Session lifetime mismatch — every 15 minutes the user is silently logged out.** `frontend/app/common/services/session-storage.ts:5` sets `SESSION_MAX_AGE = 15 * 60 * 1000`. Backend JWT is 7 days (`backend/src/controller/auth.ts:19`). No refresh. The user must log in repeatedly during a shopping session.
2. **CSRF middleware likely blocks server-side auth helpers.** `authApi.server.ts` helpers fetch without `X-Requested-With`; `csrfProtect` rejects POSTs missing the header (`backend/src/middleware/csrf.ts:33`). If this is in production this means **email/password login from the SSR action is broken**. Needs runtime confirmation.

### High

3. **Account-linking is promised but does not exist.** `google.ts:67, 156, 277` tell users to "vinculá Google desde tu perfil" — there is no profile page and no `/auth/link` endpoint. Users with LOCAL accounts cannot ever use Google login.
4. **Google login 409 (existing LOCAL account) is displayed as a generic transient error.** `frontend/app/common/services/authApi.server.ts:95` does not map status 409; the UI shows "Error al iniciar sesión con Google. Por favor, intentá más tarde." (`login.tsx:64`). The actionable message ("usá tu contraseña") is lost.
5. **No password reset.** Users locked out permanently if they forget their password.

### Medium

6. **User enumeration via login.** `controller/auth.ts:118` distinguishes "no existe una cuenta" from "Credenciales inválidas" — leaks which emails are registered.
7. **Rate-limit IP detection broken behind a proxy.** No `app.set("trust proxy", …)` in `index.ts`. On a single proxy IP all users share the bucket.
8. **No email verification.** Anyone can register with any address.
9. **`confirmPassword` only validated client-side.** Server-side `RegisterSchema` (`backend/src/schemas/auth.ts:6`) ignores it.

### Low

10. **Logout backend call is a no-op when invoked from SSR action** — `apiClient` does not forward the user's cookie server-side. Cookie clearing relies on browser applying the `Set-Cookie` from the response that, in practice, returns from a request without the token. Works by accident.
11. **Backend `RegisterSchema` exposes optional `role` field** (`backend/src/schemas/auth.ts:20`) that the controller ignores. Misleading API surface; landmine for future refactors.
12. **Deprecated `/auth/google` endpoint still live** (`routes/auth.ts:12`).
13. **`GoogleLoginButton` reads container width once** — vulnerable to layout shift / animated parents rendering 0-width Google button.
14. **Logout button has no `aria-label` and no confirmation** (`UserActions.tsx:26`).
15. **No "show password" toggle, no caps-lock indicator on password inputs.**

---

## Missing Features

A user would reasonably expect, but does NOT have:

- "Forgot my password" / password reset.
- Email verification on register.
- Profile page to manage name/email/password.
- Account linking: connecting Google to an existing LOCAL account (or vice-versa) — the codebase promises this in error messages but doesn't deliver.
- "Remember me" toggle (currently the session is hardcoded to 15 minutes regardless).
- Visible session-expiration warning ("Your session is about to expire").
- Multi-factor / 2FA.
- Social providers beyond Google (Apple, Facebook — common in Latin American e-commerce).
- Logout from all devices.
- Re-auth prompt for sensitive actions (changing email, viewing order PII).
- Account deletion / GDPR-style data export.
- "Keep me signed in" persistence across browser restarts in a way consistent with the backend's 7-day JWT.

---

## File References

Backend:
- `backend/src/routes/auth.ts:1-22` — route table.
- `backend/src/controller/auth.ts:62-105` — register.
- `backend/src/controller/auth.ts:107-157` — login.
- `backend/src/controller/auth.ts:159-162` — logout.
- `backend/src/controller/auth.ts:164-189` — verify (unused).
- `backend/src/controller/google.ts:18-35` — verifyGoogleToken.
- `backend/src/controller/google.ts:37-120` — deprecated `googleAuth`.
- `backend/src/controller/google.ts:122-208` — googleRegister.
- `backend/src/controller/google.ts:210-361` — googleLogin.
- `backend/src/middleware/auth.ts:24-45` — `authenticate`.
- `backend/src/middleware/csrf.ts:20-43` — custom-header CSRF.
- `backend/src/middleware/rate-limit.ts:9-15` — authLimiter.
- `backend/src/schemas/auth.ts:6-38` — RegisterSchema / LoginSchema.
- `backend/src/index.ts:104` — wiring of `authLimiter + authRouter`.

Frontend:
- `frontend/app/routes/auth/login.tsx:30-80` — loader + action.
- `frontend/app/routes/auth/login.tsx:82-223` — UI.
- `frontend/app/routes/auth/register.tsx:28-70` — loader + action.
- `frontend/app/routes/auth/register.tsx:40-54` — duplicated `serverGoogleRegister`.
- `frontend/app/actions/auth/register-action.tsx:14-36` — server action.
- `frontend/app/actions/auth/logout.tsx:5-11` — logout action.
- `frontend/app/common/schemas/auth.ts:3-20` — login/register Zod schemas.
- `frontend/app/common/services/auth.server.ts:10-77` — session/token helpers.
- `frontend/app/common/services/authApi.server.ts:8-108` — server-side fetch wrappers.
- `frontend/app/common/services/session-storage.ts:5-17` — session cookie config (15-min maxAge — see Critical #1).
- `frontend/app/common/components/button/GoogleLoginButton.tsx:23-130` — Google SDK integration.
- `frontend/app/common/components/nav-bar/UserActions.tsx:26-30` — logout trigger.
- `frontend/app/common/config/api-client.ts:14-50` — client-side fetch wrapper (only one that injects `X-Requested-With`).
- `frontend/app/common/constants/routes.ts:12-40` — route map.
- `frontend/app/routes.ts:53-80` — route registration for actions.
