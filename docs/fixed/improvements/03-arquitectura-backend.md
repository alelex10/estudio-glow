# 3. Arquitectura Backend

> Stack: Express 5 + Bun + Drizzle ORM + postgres-js + Zod + OpenAPI (`@asteasolutions/zod-to-openapi`).
> Auditado contra principios de Clean / Hexagonal Architecture, separación de capas, testabilidad y manejo de errores.

## Estado actual

Estructura de carpetas (sana en intención):

```
backend/src/
  controller/   # handlers Express
  services/     # CartService, OrderService, MercadoPagoService, CronService, imageUploadService
  models/       # esquemas Drizzle + relations.ts (barrel)
  routes/       # routers Express
  schemas/      # validación Zod (DTOs entrada / salida)
  middleware/   # auth, error-handler, validation, file-validation, async-handler, optimize
  errors/       # AppError + jerarquía tipada
  docs/         # OpenAPI registry + paths
  utils/        # crud-helpers
```

Capas presentes:
- `controller/*` (`backend/src/controller/product.ts:127`, `cart.ts`, `order.ts`)
- `services/*` (`backend/src/services/OrderService.ts:8`, `CartService.ts:7`)
- `db.ts` exporta una sola instancia de Drizzle (`backend/src/db.ts:14`).

Cosas bien hechas:
- `asyncHandler` envuelve handlers y delega al middleware de error (`backend/src/middleware/async-handler.ts:35`).
- Cadena de error handlers: `logErrors` → `clientErrorHandler` → `errorHandler` (`backend/src/index.ts:106-108`).
- Jerarquía tipada de errores (`AppError`, `NotFoundError`, `ConflictError`, `BadRequestError`, `AuthenticationError`, `AuthorizationError`, `DatabaseError`, `ValidationError`).
- `OrderService.createOrder` usa `db.transaction()` (`backend/src/services/OrderService.ts:14`).
- Batch query para evitar N+1 al hidratar items (`backend/src/services/OrderService.ts:255-281`).

## Problemas detectados

### 1. ALTO — No existe capa de repositorio: controllers y services hablan directo a Drizzle

Evidencia:
- `controller/product.ts:38-72`, `:172-191`, `:206-215`, `:246-247`, `:286-288`, `:312-340` — todo el archivo opera contra `db.select()/insert()/update()/delete()` con `eq/and/ilike/...` directamente.
- `controller/category.ts:26-200` — idem, queries crudas en el controlador (incluso CRUD entero).
- `controller/auth.ts:68-90`, `controller/google.ts:49-95` — mismo patrón.
- `controller/dashboard.ts:37-72` — funciones SQL embebidas en el controlador.
- Los services existentes (`OrderService`, `CartService`) tampoco delegan a un repo: ellos también tienen Drizzle dentro.

Impacto: viola Clean/Hexagonal. La dependencia hacia infra (Drizzle) está acoplada al transporte (HTTP). Cambiar de ORM o testear con stubs requiere reescribir controllers.

### 2. ALTO — Lógica de negocio en controllers en vez de services

Evidencia:
- `controller/product.ts:127-165` — `listProductsPaginated` arma filtros, conteo y query paginada en el controller (debería ser `ProductService.list({...})`).
- `controller/category.ts:80-117` (create), `:121-166` (update), `:169-200` (delete con regla de negocio "no borrar si tiene productos asociados") — todo en el controller.
- `controller/auth.ts:63-106` — registro: hash, generación de token, set cookie, build response. No hay `AuthService`.
- `controller/google.ts:40-391` — flujo entero (verificar token Google → buscar/crear/vincular usuario → emitir JWT) en el controller. **391 líneas**, alta complejidad ciclomática.
- `controller/dashboard.ts:37-72` — agregaciones SQL en el controller.

Impacto: imposible reusar la lógica fuera de Express (workers, CLI, GraphQL). Tests requieren montar Express + mock de DB.

### 3. ALTO — Métodos `static` en services impiden inyección de dependencias

Evidencia: `OrderService` (`OrderService.ts:8`), `CartService` (`CartService.ts:7`), `MercadoPagoService` (`MercadoPagoService.ts:7`), `ImageUploadService` (`imageUploadService.ts:13`) — todos clases con métodos `static` que importan `db` y SDKs externos directamente.

Impacto:
- No se puede inyectar un repo mock ni un cliente MP fake para tests.
- `MercadoPagoService` instancia `new MercadoPagoConfig` en módulo (`MercadoPagoService.ts:5`) y `routes/webhooks.ts:7` también — el token se lee al cargar el módulo, dificulta rotación y testing.
- Acoplamiento estático a `db` en cada archivo — mismo patrón que un singleton global.

### 4. ALTO — Manejo de errores inconsistente: mezcla `throw AppError` con `res.status(...).json(...)` directo

Evidencia:
- `controller/order.ts:64` — `return res.status(403).json({ error: "You can only view your own orders" })`. Debería ser `throw new AuthorizationError(...)`.
- `controller/order.ts:82` — `res.status(400).json({ error: "..." })`. Debería ser `throw new BadRequestError(...)` o un `OrderStateError`.
- `services/OrderService.ts:36`, `:39`, `:73`, `:114`, `:156` — `throw new Error("...")` plano (no `AppError`). Llega al `errorHandler` final como 500, perdiendo semántica HTTP.
- `services/CartService.ts:13`, `:18` — usa `DatabaseError` para "Cart not found" (debería ser `NotFoundError` 404, no 500).

Impacto: el formato de respuesta de error NO es uniforme:
- Vía `AppError` → `{ error: { code, message } }` (`error-handler.ts:71-80`).
- Vía Zod → `{ error: { code, message, details: [...] } }` (`error-handler.ts:84-97`).
- Vía `res.status(...).json({ error: "..." })` → `{ error: "string" }` (raw).
- `controller/favorite.ts:44` y `controller/category.ts:198` devuelven `{ message: "..." }` sin envelope ni `data`.

### 5. MEDIO — `crud-helpers.ts` es útil pero filtra preocupaciones de capas

Evidencia: `utils/crud-helpers.ts:17-33` — `checkEntityExists<T>(table: any, ...)` con `table: any` (pierde tipado), y mezcla "verificar existencia en BD" (repo) con "armar respuesta HTTP" (`successResponse` línea 83, `createdResponse` línea 96).

Impacto: helper híbrido. Si esto se trasladara a un `Repository.exists(id)` y un `responseEnvelope()` separado, mejora separación.

Nota positiva: el patrón de `checkProductExists / checkCategoryExists / checkOrderExists` (líneas 42-75) es razonable y reduce duplicación. **No es CRUD genérico** (no genera endpoints automáticos): es un set acotado de helpers de validación. No es code smell grave.

### 6. MEDIO — Validación duplicada en pipeline de rutas

Evidencia: en `routes/orders.ts:14-15` se llama `validateQuery(PaginationOrderQuerySchema)` y `validateParams(ParamsIdSchema)` en el router; pero el controller también re-parsea: `controller/order.ts:14` `PaginationOrderQuerySchema.parse(req.query)`, `:33` `req.params as { id: string }`. Lo mismo en `controller/product.ts:130` (re-parse) y `routes/products.ts` no aplica el middleware (re-validación en el controller).

Impacto: validación inconsistente — algunos endpoints validan en middleware + controller, otros sólo controller, otros sólo middleware. El doble parse desperdicia ciclos y oculta cuál es la fuente de verdad.

### 7. MEDIO — `CronService` usa `setInterval` en proceso del API server

Evidencia: `services/CronService.ts:6-28` — `setInterval(async () => {...}, 60000)` arrancado en `index.ts:104`.

Impacto:
- Si corren múltiples instancias del API (Render escalado horizontal), cada una ejecuta el job → race conditions sobre `cancelOrder` y `EXPIRED`.
- No hay locking pesimista (`SELECT ... FOR UPDATE SKIP LOCKED`) ni leasing de jobs.
- Errores se logean pero no se reportan (`console.error("Cronjob error:", err)` línea 25).
- El cronjob NO controla si la operación termina antes del próximo tick (overlapping si la BD se pone lenta).
- `CronService.ts:21-22` — `cancelOrder` ya hace `update status = CANCELLED`, y luego se sobrescribe a `EXPIRED` en la línea 22. El estado correcto para órdenes vencidas debería ser `EXPIRED` directamente (sin pasar por `CANCELLED`).

### 8. MEDIO — `dotenv.config()` se llama en múltiples archivos

Evidencia: `controller/auth.ts:19`, `controller/google.ts:14`, `services/MercadoPagoService.ts:3`, `middleware/auth.ts:6`, `db.ts:6`, `migrate.ts:1`. Se ejecuta varias veces; el código no falla pero indica que falta un módulo `config/env.ts` que valide y exporte env de manera única (idealmente con Zod).

### 9. MEDIO — JWT verificado con fallback inseguro

Evidencia:
- `middleware/auth.ts:8` — `const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";`
- `controller/auth.ts:21` — mismo fallback `"your_jwt_secret_key"`.
- `controller/google.ts:16` — `"your_jwt_secret_key"`.
- `routes/webhooks.ts:7` — `process.env.MP_ACCESS_TOKEN || 'test_token'`.

Impacto: si la env var falta, el server arranca con un secreto público conocido y firma tokens válidos — vulnerabilidad clásica.

### 10. BAJO — No hay aliases de path (`@/`)

Evidencia: `tsconfig.json:1-39` no define `paths` ni `baseUrl`. Imports del estilo `../../models/relations` proliferan (p. ej. `controller/order.ts:3`, `services/OrderService.ts:1-7`).

Impacto: más ruido cognitivo, dificulta refactor de carpetas. No es crítico.

### 11. BAJO — `tsconfig` no compila a `dist` y `outDir` es ignorado

Evidencia: `tsconfig.json:14` `noEmit: true` y `outDir: "dist"` (línea 35) coexisten — `outDir` no aplica. Bun ejecuta `.ts` directamente, pero la build no produce JS estable. Puede impactar despliegue si se cambia a Node.

### 12. BAJO — Logs estructurados sólo en `googleLogin`

Evidencia: `controller/google.ts:246-389` — usa `console.log(JSON.stringify({...}))` con requestId, duración y categoría. Excelente práctica, pero está aislada a ESE handler. El resto usa `console.error("❌ ...", ...)` (`error-handler.ts:30-43`) inconsistente, sin `requestId` correlable entre middlewares.

### 13. BAJO — Tag de "deprecated" en endpoint sin cronograma

Evidencia: `controller/google.ts:43` — header `Warning: 299` recomendando `/auth/google/register|login`. Está bien, pero sin versión target ni fecha.

## Recomendaciones

Priorizadas por valor/esfuerzo.

### P1 — Introducir capa Repository (resuelve #1, #3, gran parte de #5)

```ts
// repositories/ProductRepository.ts
export class ProductRepository {
  constructor(private readonly db: DrizzleDb) {}

  findById(id: string) { return this.db.select().from(products).where(eq(products.id, id)).limit(1); }
  exists(id: string)   { /* ... */ }
  paginate(filters: ProductFilters, page: number, limit: number) { /* ... */ }
  // ...
}
```

Y un container simple (no hace falta InversifyJS):

```ts
// container.ts
export const productRepo = new ProductRepository(db);
export const productService = new ProductService(productRepo, imageUploader);
```

Beneficios: tests con `new ProductService(fakeRepo, fakeUploader)` sin tocar BD; un solo lugar donde cambia `eq` → otro ORM.

### P2 — Mover lógica de negocio a services (resuelve #2)

- `controller/product.ts` debe quedar en ~50 líneas: parsear `req.body`/`req.query` validados y delegar a `productService.create(...)`/`.list(...)`.
- `controller/google.ts` (391 líneas) → `AuthService.googleLogin(idToken)`. El controller queda con ~10 líneas.

### P3 — Errores 100% vía `AppError` (resuelve #4)

Reemplazar `services/OrderService.ts:36, 39, 73, 114, 156` (`throw new Error(...)`) por errores tipados:

```ts
throw new NotFoundError(`Product ${item.productId} not found`);
throw new BadRequestError(`Insufficient stock for ${product[0].name}`);
```

Y en `controller/order.ts:64, 82`:

```ts
if (order.userId !== userId) throw new AuthorizationError("...");
throw new ConflictError("Order cannot be approved from current status");
```

Estandarizar respuestas de error en RFC 7807 (`application/problem+json`) o, al menos, mantener un único envelope `{ error: { code, message, details? } }` en TODA la API. Decidir y documentar.

### P4 — Centralizar config en `config/env.ts` con Zod (resuelve #8, #9)

```ts
const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  MP_ACCESS_TOKEN: z.string().min(10),
  GOOGLE_CLIENT_ID: z.string(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});
export const env = EnvSchema.parse(process.env);
```

Si falta `JWT_SECRET`, el proceso CRASHEA al boot — no arrancar con secret público.

### P5 — Sacar el cron a un proceso separado (resuelve #7)

- En Render: usar un `worker` service distinto al `web` con su propio Dockerfile.
- O usar `pg-boss` / `BullMQ`: persiste jobs en BD/Redis, idempotente, soporta retries y locking.
- Para órdenes expiradas, una alternativa simple: `UPDATE orders SET status='EXPIRED' WHERE expires_at < NOW() AND status IN ('PENDING','PENDING_VERIFICATION') RETURNING id;` y luego devolver stock por los IDs retornados — todo en una transacción.

### P6 — Consolidar validación en middleware (resuelve #6)

Regla: si la ruta declara `validateBody/Query/Params`, el controller NO re-parsea — sólo lee `req.body`/`req.query` ya tipados. Tipar `Request` con generics o usar un wrapper `typedHandler<TBody, TQuery, TParams>(...)`.

### P7 — Aliases de path (resuelve #10)

```jsonc
// tsconfig.json
"baseUrl": "./src",
"paths": { "@/*": ["*"] }
```

Imports `import { db } from "@/db"` en lugar de `"../../db"`.

### P8 — Logger de aplicación

Reemplazar `console.*` por `pino` (rápido, JSON-first). Inyectar `requestId` con `nanoid` en un middleware al inicio del pipeline para correlación end-to-end. Esto generaliza lo bueno de `controller/google.ts:246-389` a TODA la API.

## Referencias

- Clean Architecture, Robert C. Martin — separación capas + DIP.
- Hexagonal Architecture, Alistair Cockburn — puertos/adaptadores aplicados a Repository.
- Express docs: error handling middleware order — https://expressjs.com/en/guide/error-handling.html
- Zod env validation pattern — https://github.com/colinhacks/zod#environment-variables
- pg-boss (Postgres-backed jobs) — https://github.com/timgit/pg-boss
- Pino logger — https://getpino.io
