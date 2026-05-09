# 7. Estrategia de Testing

## Estado actual

**No existe NADA de testing.** Verificado:

- `frontend/package.json:5-11` — scripts: `build`, `dev`, `build:server`, `start`, `typecheck`. **Sin `test`**. Sin Vitest/Jest/Playwright en deps ni devDeps.
- `backend/package.json:15-21` — scripts: `start`, `dev`, `generate`, `migrate`, `seed`. **Sin `test`**. Sin runner de tests (a pesar de que Bun trae `bun:test` builtin).
- `find . -name '*.test.ts' -o -name '*.spec.ts'` no devuelve nada en el repo.
- No hay `vitest.config.ts`, `playwright.config.ts`, `jest.config.*` ni `__tests__/`.
- No hay CI configurado (revisar `.github/workflows/` no presente).

Esto es inaceptable para un proyecto que **maneja pagos reales con Mercado Pago, JWT auth, y un panel de administración con CRUD de productos y aprobación de órdenes**. Es donde más duele equivocarse.

## Problemas detectados

### 1. CRÍTICO — Cero cobertura sobre el flujo de pago
**Severidad: CRÍTICA**
`frontend/app/routes/checkout/checkout.tsx` ejecuta `cart sync` + `mercadopago/preference` o `transfer` con upload de comprobante. Si esto rompe en producción, los usuarios pagan o no compran. No hay un solo test que cubra:
- "carrito vacío bloquea checkout"
- "MP devuelve `preferenceUrl` y redirige"
- "TRANSFER sin receipt falla con mensaje correcto"
- "el cliente NO debe ver el token JWT en el HTML" (regresión de seguridad)

### 2. CRÍTICO — Cero cobertura sobre validaciones Zod compartidas
**Severidad: ALTA**
- `frontend/app/common/schemas/auth.ts` (login + register).
- `frontend/app/common/schemas/categorySchema.ts`.
- `backend/src/schemas/*.ts`.

No hay un solo test sobre, por ejemplo:
- "registerSchema rechaza password < 6 chars".
- "loginSchema acepta email válido".
- "createProductSchema coerce price a number".
Cualquier cambio en Zod puede romper validaciones silenciosamente.

### 3. ALTO — Cero cobertura sobre webhooks de Mercado Pago
**Severidad: ALTA (financiera)**
El backend recibe webhooks asíncronos. Sin tests de integración, una orden puede quedar en `PENDING_VERIFICATION` indefinidamente o, peor, marcarse `PAID` por un webhook fraudulento. Mercado Pago provee firma + IPN — sin tests no se valida.

### 4. ALTO — Auth flow sin tests
- `actions/auth/login-action.tsx`, `register-action.tsx`, `google-login-action.tsx`.
- `auth.server.ts:19` (`requireAuth` redirige si no hay token).
- `auth.server.ts:47` (`createAuthSession` setea cookie).

Cualquier regresión rompe acceso a admin o sesiones.

### 5. ALTO — Sin tests de integración con DB (Drizzle)
`backend/src/services/*` consultan PostgreSQL vía Drizzle. Sin tests con DB real (testcontainers) o `pg-mem`/`drizzle-orm/sqlite`, los cambios en queries de paginación o joins (productos con categorías, órdenes con items) son ciegos.

### 6. MEDIO — Sin smoke E2E
Una sola prueba Playwright `home → /products → click producto → add to cart → /cart → /checkout` validaría el 70% del valor del producto en cada commit.

### 7. MEDIO — Sin contract tests del cliente HTTP
`api-client.ts` tiene branches: `404 → empty pagination`, error JSON parse fallback (`:38-44`), FormData vs JSON. Sin tests, refactors lo rompen.

## Recomendaciones — Estrategia priorizada

### Capas y herramientas

| Capa | Herramienta | Ámbito | Velocidad | Costo |
|---|---|---|---|---|
| Unit (lógica pura) | **Vitest** | servicios, utils, parseFormData, helpers, schemas Zod | <1s | Bajo |
| Component | **Vitest + @testing-library/react** | componentes presentacionales (CardView, FormInput, ProductForm), Toast, ConfirmModal | <2s | Bajo |
| Loader/Action (RR7) | **Vitest** invocando `loader({ request })` directo | unit de loaders y actions | <1s | Bajo |
| Backend unit | **`bun:test`** (ya viene con Bun) | controllers, services con mocks, schemas | <1s | Cero (built-in) |
| Backend integración (DB) | **Vitest + testcontainers / Supabase local** | rutas Express + Drizzle contra Postgres real | 2-10s | Medio |
| E2E | **Playwright** | flujos críticos: login, compra MP, transfer, admin aprueba/rechaza | 30-60s | Medio |

### Prioridad 1 — Setup y red de seguridad mínima (semana 1)

1. **Backend `bun:test`**:
   ```jsonc
   // backend/package.json
   "scripts": {
     "test": "bun test",
     "test:watch": "bun test --watch"
   }
   ```
   Primer test:
   ```ts
   // backend/src/schemas/auth.test.ts
   import { test, expect } from "bun:test";
   import { LoginSchema, RegisterSchema } from "./auth";

   test("LoginSchema rechaza email inválido", () => {
     const r = LoginSchema.safeParse({ email: "no-es-email", password: "12345678" });
     expect(r.success).toBe(false);
   });

   test("RegisterSchema exige password ≥ 6", () => {
     const r = RegisterSchema.safeParse({ name: "x", email: "a@b.com", password: "12345" });
     expect(r.success).toBe(false);
   });
   ```

2. **Frontend Vitest**:
   ```bash
   bun add -d vitest @testing-library/react @testing-library/user-event jsdom @vitejs/plugin-react
   ```
   `vitest.config.ts`:
   ```ts
   import { defineConfig } from "vitest/config";
   import react from "@vitejs/plugin-react";
   import tsconfigPaths from "vite-tsconfig-paths";
   export default defineConfig({
     plugins: [react(), tsconfigPaths()],
     test: { environment: "jsdom", globals: true, setupFiles: ["./test/setup.ts"] },
   });
   ```
   Importante: separar el config de Vitest del de RR7 para no contaminar el build.

3. **Tests "tripwire" (humo)** — 5 tests que rompen si cualquier cosa crítica falla:
   - `loginSchema/registerSchema/createProductSchema` sanity.
   - `parseFormData` parsea `price` a number.
   - `auth.server.requireAuth` lanza redirect si no hay cookie.
   - Loader de `home` retorna `{ newProducts }`.
   - `CartContext.addToCart` con item duplicado suma quantity (no duplica).

### Prioridad 2 — Cobertura del flujo de pago (semana 2)

4. **Test de loader/action de checkout** sin browser:
   ```ts
   // routes/checkout/checkout.test.ts
   import { test, expect, vi } from "vitest";
   import { loader } from "./checkout";

   test("checkout sin cookie redirige a /login?redirect=/checkout", async () => {
     const req = new Request("http://x/checkout"); // sin Cookie header
     await expect(loader({ request: req, params: {}, context: {} })).rejects.toMatchObject({
       status: 302, headers: { location: "/login?redirect=/checkout" }
     });
   });
   ```

5. **Backend integración con testcontainers** o (más simple) Supabase local:
   ```ts
   // backend/test/checkout.integration.test.ts — bun:test
   // Levanta DB con docker-compose.test.yml, corre seed mínimo,
   // POST /cart/sync → POST /checkout/transfer con file → assert order.PENDING_VERIFICATION
   ```

6. **Mercado Pago webhook**: mock del payload de IPN + assert de transición de estado. Si MP exige firma, validar firma con secret de test.

### Prioridad 3 — E2E del happy path (semana 3)

7. **Playwright smoke**:
   ```bash
   bun add -d @playwright/test
   bunx playwright install --with-deps chromium
   ```
   Tres specs:
   - `auth.spec.ts`: registro → login → ve `/`.
   - `purchase-transfer.spec.ts`: home → producto → add to cart → checkout transfer → upload receipt → orden creada.
   - `admin-approves.spec.ts`: login admin → /admin/orders → aprueba pendiente → estado cambia.

   Correr contra `bun run dev` (frontend) + backend con DB de test. CI: GitHub Actions matrix.

### Prioridad 4 — Cobertura sostenida

8. **Reglas mínimas** (no hard-coverage targets — son métricas de vanidad):
   - Cada bug fix se acompaña de un test que reproduce el bug.
   - Cada nuevo schema Zod tiene al menos 2 tests (acepta válido, rechaza un caso borde).
   - Cada nueva ruta `action` tiene al menos un test happy-path + un error.
9. **CI**:
   ```yaml
   # .github/workflows/ci.yml
   - run: bun install
   - run: bun run --cwd backend test
   - run: bun run --cwd frontend typecheck
   - run: bun run --cwd frontend test
   - run: bunx playwright test  # solo en main + PRs label "e2e"
   ```

### Anti-patrones a evitar

- **No mockear todo**. Si mockeás `fetch` para testear `productService.getProduct`, el test es tautológico. Mejor: test de integración contra servidor real con MSW o test E2E.
- **No buscar 100% coverage**. 30% bien dirigido a flows críticos vale más que 95% sobre componentes triviales.
- **No testear implementación**. `expect(useState).toHaveBeenCalled()` rompe a la primera refactor. Testear comportamiento visible (RTL: queries por rol/label).

## Referencias

- Vitest: https://vitest.dev/
- Bun test: https://bun.com/docs/cli/test
- React Testing Library: https://testing-library.com/docs/react-testing-library/intro/
- Playwright: https://playwright.dev/
- testcontainers Node: https://node.testcontainers.org/
- Kent C. Dodds — Testing Trophy: https://kentcdodds.com/blog/the-testing-trophy-and-testing-classifications
- Mercado Pago — webhook signing: https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
