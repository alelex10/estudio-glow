# 5. Diseño de API

> Stack: Express 5 + Zod + `@asteasolutions/zod-to-openapi` (+ residual `swagger-jsdoc` en deps).
> Auditado: convenciones REST, paginación, filtering, versionado, formato de respuesta, errores, OpenAPI sync, webhooks, idempotencia.

## Estado actual

Rutas registradas en `index.ts:92-101`:

| Mount | Router | Auth |
|---|---|---|
| `/products` | `routes/products.ts` | mixto (público listing, admin write) |
| `/categories` | `routes/categories.ts` | público read, admin write |
| `/auth` | `routes/auth.ts` | público (login/register/google) |
| `/users` | `routes/users.ts` | autenticado |
| `/favorites` | `routes/favorites.ts` | autenticado |
| `/orders` | `routes/orders.ts` | admin |
| `/cart` | `routes/cart.ts` | autenticado |
| `/checkout` | `routes/checkout.ts` | autenticado |
| `/dashboard` | `routes/dashboard.ts` | autenticado |
| `/api/webhooks` | `routes/webhooks.ts` | público |

Cosas bien hechas:
- Status `201` en creación (`controller/product.ts:249`, `controller/auth.ts:104`, `controller/category.ts:111`, `controller/google.ts:225`).
- Verbos HTTP correctos en CRUD productos/categorías.
- Validación Zod en `validateBody/Query/Params` (`middleware/validation.ts`).
- OpenAPI con Zod integrado (`@asteasolutions/zod-to-openapi`) — schemas tipados se exponen como definiciones.
- Pagination metadata útil: `totalItems`, `totalPages`, `hasNextPage`, `hasPreviousPage` (`OrderService.ts:210-217`, `types/pagination.ts:14-21`).

## Problemas detectados

### 1. ALTO — No hay versionado de API

Evidencia: rutas montadas en raíz: `/products`, `/categories`, `/orders`, etc. (`index.ts:92-101`). Sólo `/api/webhooks` usa prefijo `/api`, e inconsistente con el resto.

Impacto: cualquier breaking change (cambio de campo, formato de respuesta, enum) rompe TODOS los clientes (web + futuro mobile). No hay forma de deprecar gradualmente.

Fix: montar bajo `/api/v1/...`. El gateway/router público puede seguir sin prefijo si querés, pero el código backend debe tenerlo.

### 2. ALTO — Formato de respuesta inconsistente: cada endpoint inventa el suyo

Evidencia (envelope variado):
- `controller/product.ts:163` → `res.json(response)` con `{ data, pagination }` (raw, sin `message`).
- `controller/product.ts:198` → `res.json(successResponse(...))` con `{ message, data }`.
- `controller/order.ts:27` → `res.json(result)` raw `{ data, pagination }`.
- `controller/order.ts:35` → `res.json(order)` raw OrderWithItems sin envelope.
- `controller/category.ts:51-56` → envelope `{ message, data }` vía `ResponseSchema.parse`.
- `controller/category.ts:75` → `res.json(result[0])` raw Category.
- `controller/category.ts:198` → `res.json({ message: "..." })` sin `data`.
- `controller/favorite.ts:44` → `{ message }` directo, no `{ message, data }`.
- `controller/favorite.ts:91` → `{ data: result }` sin `message`.
- `controller/favorite.ts:103` → `{ data: ids }`.
- `controller/auth.ts:104` → `{ message, user, token }` ad-hoc sin pasar por envelope.
- `controller/user.ts:26` → `{ user: ... }` sin envelope.
- `routes/checkout.ts:28, 41` → `{ orderId, preferenceUrl }` raw.

Impacto: el cliente debe escribir parsers distintos por endpoint. Imposible escribir un wrapper genérico de fetch.

### 3. ALTO — Errores con formatos distintos según el camino

Evidencia:
- AppError → `{ error: { code, message } }` (`error-handler.ts:71-80`).
- Zod → `{ error: { code, message, details: [{ path, message }] } }` (`error-handler.ts:84-97`).
- `controller/order.ts:64` → `{ error: "string" }` (NO objeto).
- `controller/order.ts:82` → `{ error: "string" }`.
- `ErrorResponseSchema` (`schemas/auth.ts:75-82`) define `{ message: string }` (¡tercer formato!) y se usa como respuesta documentada en OpenAPI (`docs/products.ts:65, 99, 158, 197`).

Impacto:
- La respuesta REAL no matchea la respuesta DOCUMENTADA en OpenAPI. El cliente generado a partir del spec va a fallar.
- Imposible hacer interceptors de error consistentes en el frontend.

Fix: estandarizar en RFC 7807 problem+json o en `{ error: { code, message, details? } }`. Actualizar `ErrorResponseSchema` para que matchee.

### 4. ALTO — Webhook MercadoPago sin idempotencia ni verificación de firma

Evidencia: `routes/webhooks.ts:11-24`:
```ts
router.post("/mercadopago", asyncHandler(async (req, res) => {
  const { action, data, type } = req.body;
  if ((action === "payment.updated" || type === "payment") && data?.id) {
    const payment = await paymentSDK.get({ id: data.id });
    if (payment.status === "approved" && payment.external_reference) {
      await OrderService.markOrderPaid(payment.external_reference);
    }
  }
  res.sendStatus(200);
}));
```

Problemas:
1. No verifica firma `x-signature` de MercadoPago — cualquier atacante puede `POST /api/webhooks/mercadopago` con un `data.id` de payment válido y marcar órdenes como pagas.
2. No hay deduplicación por event id — MP reentrega webhooks; si llega dos veces, `markOrderPaid` se ejecuta dos veces (idempotente para state, pero podría causar problemas si después se agrega lógica de side effect tipo "enviar email").
3. `markOrderPaid` (`OrderService.ts:100-105`) no verifica el estado actual — si la orden ya está `CANCELLED` o `EXPIRED` se sobreescribe a `PAID`.

### 5. ALTO — Endpoints de checkout sin idempotency-key

Evidencia: `routes/checkout.ts:18-29`:
```ts
router.post("/mercadopago", asyncHandler(async (req, res) => {
  const order = await OrderService.createOrder(userId, "MERCADO_PAGO");
  const preference = await MercadoPagoService.createPreference(...);
  res.json({ orderId: order.id, preferenceUrl: preference.init_point });
}));
```

Impacto:
- Si el cliente reintenta el POST (network glitch, doble click), se crea OTRA orden con OTRA preference. La primera queda colgada esperando expirar.
- En `transfer` (`:31-42`), peor: se sube el comprobante DOS veces a Cloudinary.

Fix: aceptar header `Idempotency-Key`, hashearlo y guardar `idempotency_keys (key, order_id, created_at)`. Si la key ya existe, devolver la orden previa.

### 6. ALTO — `DELETE` devuelve `200 + body` en vez de `204 No Content`

Evidencia:
- `controller/product.ts:307` — `res.json(successResponse(null, "Producto eliminado"))` con 200.
- `controller/category.ts:198` — `res.json({ message: "..." })` con 200.
- `controller/favorite.ts:66` — `res.status(200).json({ message: "..." })`.

Impacto: convención REST establecida es `204 No Content` o `200` con representación recomendable. No es bug, pero inconsistente con el `201` que sí respetan.

### 7. ALTO — `OrderService.markOrderPaid` y `cancelOrder` sin checks de estado

Evidencia:
- `markOrderPaid` (`OrderService.ts:100-105`): set `PAID` y `expiresAt = null` sin condición — si la orden está `CANCELLED`/`EXPIRED`, igual la marca paga.
- `cancelOrder` (`:108-146`): tiene check de estado (`:117-122`) — bien. Pero el cron luego sobreescribe a `EXPIRED` aunque el cancel ya hizo `CANCELLED` (`CronService.ts:21-22`).

### 8. MEDIO — OpenAPI desactualizado: faltan endpoints

Evidencia: en `docs/openapi.ts:5-8` sólo se importan `auth`, `products`, `categories`, `dashboard`. **NO están**:
- `/cart`, `/cart/sync`, `/cart/:productId`
- `/orders` (GET admin), `/orders/:id`, `/orders/:id/approve`, `/orders/:id/reject`
- `/users/me`, `/users/orders`, `/users/orders/:id`
- `/favorites/*`
- `/checkout/mercadopago`, `/checkout/transfer`
- `/api/webhooks/mercadopago`

El OpenAPI publicado en `/api-docs` (`index.ts:84`) muestra una API ~30% del total real.

### 9. MEDIO — `ErrorResponseSchema` declarado en OpenAPI no matchea el handler

Evidencia: `schemas/auth.ts:75-82` declara `{ message: string }`, pero el handler real (`error-handler.ts:73-80`) emite `{ error: { code, message } }`. Documentación mentirosa.

### 10. MEDIO — Convenciones REST mixtas: acciones como sub-recursos

Evidencia: `routes/orders.ts:16-17`:
```ts
orderRouter.post("/:id/approve", ...);
orderRouter.post("/:id/reject", ...);
```

Está bien en el sentido "comando con efecto" (acepto), pero convive con verbo HTTP genérico. Alternativa: `PATCH /orders/:id { status: "PAID" }` con state machine en service. Decidir y mantener consistencia. Actualmente es un mix sin lineamiento.

### 11. MEDIO — Paginación correcta pero sin `Link` headers ni cursor

Evidencia: `OrderService.getUserOrders/getOrders`, `controller/product.ts:listProductsPaginated` — todo offset/limit con metadata en body.

Impacto: a partir de ~1M filas, `OFFSET 1000000 LIMIT 10` es lento. Para listings infinitos (scroll en mobile) cursor pagination es mejor. Hoy no es bloqueante; lo dejo en MEDIO.

### 12. MEDIO — Búsqueda y filtrado: 3 endpoints distintos para casi lo mismo

Evidencia:
- `GET /products/search` (`product.ts:312`) — sin paginación, max 10 (`q`, `categoryId`, `minPrice`, `maxPrice`).
- `GET /products/paginated` (`product.ts:127`) — con paginación, filtros `q`, `category` (por nombre), `categoryId`, `stock`.
- `GET /products/news` (`product.ts:206`) — top 8 más nuevos.

Impacto:
- Lógica de filtros duplicada: `searchProducts` (`:312-340`) reimplementa lo que `buildProductFilters` (`:29-75`) ya hace.
- "buscar por categoría por nombre" vs "buscar por categoryId" en el mismo endpoint genera ambigüedad.
- `GET /products/news` es básicamente `GET /products/paginated?sortBy=createdAt&sortOrder=desc&limit=8`.

Fix: unificar en `GET /products` con todos los filtros + `?limit=8&sort=-createdAt` para "news".

### 13. MEDIO — Status codes faltantes/incorrectos

- `controller/order.ts:82` — `400` para "Order cannot be approved from current status" → debería ser `409 Conflict` (estado del recurso no permite la operación).
- `controller/favorite.ts:44` — `201` está OK, pero el cuerpo no incluye el favorito creado (mejor incluirlo con su id para que el cliente no haga otra request).
- `controller/cart.ts:30` — DELETE devuelve el cart actualizado con 200 (acceptable; usar 204 si querés ser estricto).

### 14. BAJO — `swagger-jsdoc` instalado pero no usado

Evidencia: `package.json:44` lista `"swagger-jsdoc": "^6.2.8"`. No hay imports en `src/`. Dead dependency.

### 15. BAJO — `routes/public.ts` parece muerto

Evidencia: `routes/public.ts:8-9` define `/products/paginated` y `/search`, pero no se monta en `index.ts:92-101`. Código residual.

### 16. BAJO — `query` filtering no normalizado

Evidencia:
- En `/products/paginated` el filtro de stock es `?stock=low|out|ok` (`schemas/product.ts:175-178`).
- En `/orders` los filtros son `?status=PAID&paymentMethod=TRANSFER` (`schemas/order.ts:16-29`).
- No hay convención general (`?filter[status]=PAID&sort=-createdAt&page[size]=20` estilo JSON:API es una opción).

Impacto: cada endpoint inventa nombres y semántica de filtros. Ok hoy con pocos endpoints; más cuesta a futuro.

### 17. BAJO — `createdAt`/`updatedAt` se serializan diferente según el endpoint

Algunos endpoints van por Zod schemas (que parsean a Date), otros raw select de Drizzle. Date en JSON termina como ISO string, pero la documentación OpenAPI declara `z.date()` (`schemas/product.ts:113-119`) que espera `Date`. Impacto bajo: la mayoría de clientes parsean string como Date sin problema.

### 18. BAJO — Cookie `token` y header `Authorization` conviven sin razón

Evidencia: `middleware/auth.ts:29-36` lee primero `req.cookies.token` y si no, `Authorization: Bearer ...`. La respuesta de login devuelve **AMBOS**: cookie + token en body (`controller/auth.ts:104, 156`).

Impacto: confusión en clientes — ¿uso uno u otro? Para SPA web con cookie httpOnly + SameSite es más seguro NO devolver el token en body (XSS no puede leerlo). Para mobile SDK es mejor sólo Bearer. Pick one strategy per client.

## Recomendaciones

### P1 — Versionar API + envelope único + error format único

1. Mover routers a `app.use("/api/v1/...", ...)` en `index.ts`.
2. Definir un envelope canónico:

```ts
// schemas/envelope.ts
export const SuccessEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ data, meta: z.object({}).passthrough().optional() });

export const ErrorEnvelope = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
  }),
});
```

3. Reemplazar `ErrorResponseSchema` (`schemas/auth.ts:75-82`) por `ErrorEnvelope`.
4. Reemplazar TODOS los `res.json(raw)` por `res.json({ data: raw })` o `res.json({ data: raw, meta: { pagination } })`.
5. Reemplazar `res.status(403).json({ error: "..." })` por `throw new AuthorizationError(...)`.

### P2 — Webhook MP: firma + dedupe (resuelve #4)

```ts
import crypto from "crypto";

router.post("/mercadopago", asyncHandler(async (req, res) => {
  const sig = req.header("x-signature");
  const reqId = req.header("x-request-id");
  // verificar HMAC con MP_WEBHOOK_SECRET — ver docs MP
  if (!verifyMpSignature(sig, reqId, req.body, process.env.MP_WEBHOOK_SECRET!)) {
    throw new AuthenticationError("Invalid signature");
  }

  // dedupe: tabla webhook_events (event_id pk, processed_at)
  const eventId = req.body?.id?.toString();
  const inserted = await db.insert(webhookEvents).values({ eventId, source: "mp" })
    .onConflictDoNothing().returning();
  if (inserted.length === 0) return res.sendStatus(200); // already processed

  // ... lógica
}));
```

Y `markOrderPaid` debe verificar estado actual:
```ts
await tx.update(orders)
  .set({ status: "PAID", expiresAt: null })
  .where(and(eq(orders.id, orderId), inArray(orders.status, ["PENDING", "PENDING_VERIFICATION"])));
```

### P3 — Idempotency-Key en checkout (resuelve #5)

```ts
const idempotencyKey = req.header("Idempotency-Key");
if (idempotencyKey) {
  const cached = await idempotencyRepo.get(userId, idempotencyKey);
  if (cached) return res.json(cached.response);
}
const order = await OrderService.createOrder(...);
const response = { orderId: order.id, ... };
if (idempotencyKey) await idempotencyRepo.save(userId, idempotencyKey, response);
res.json(response);
```

Con TTL de 24h y unique compuesto `(user_id, key)`.

### P4 — Sincronizar OpenAPI con TODAS las rutas (resuelve #8, #9)

- Crear `src/docs/cart.ts`, `orders.ts`, `users.ts`, `favorites.ts`, `checkout.ts`, `webhooks.ts` con `registry.registerPath(...)`.
- Importarlos en `docs/openapi.ts:5-8`.
- En CI agregar un test que ejecute `generateOpenApi()` y verifique que cada router de Express tenga al menos un path registrado en el spec (introspección de `app._router.stack`).

### P5 — Unificar productos: un solo endpoint `GET /products` (resuelve #12)

```
GET /api/v1/products?q=...&categoryId=...&category=...&stock=low&sort=-createdAt&page=1&limit=10
```

Eliminar `/products/news` y `/products/search` (o dejarlos como aliases con redirect 301 mientras se migra).

### P6 — State machine explícita para `Order.status`

Hoy hay lógica de transiciones dispersa (`approveOrder` permite `PENDING|PENDING_VERIFICATION → PAID`; `cancelOrder` chequea inverso; `markOrderPaid` no chequea nada). Modelar:

```ts
const transitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["PAID", "CANCELLED", "EXPIRED"],
  PENDING_VERIFICATION: ["PAID", "CANCELLED"],
  PAID: [],         // terminal
  CANCELLED: [],    // terminal
  EXPIRED: [],      // terminal
};
```

Y un `OrderService.transitionTo(orderId, newStatus)` validando.

### P7 — Decidir cookie XOR Bearer para cada cliente

- Web SPA con cookies de same-site: cookie httpOnly + CSRF token. NO devolver `token` en JSON.
- Mobile / API third-party: Bearer en `Authorization`, no cookie.

Documentar en el README cuál usar para qué cliente.

### P8 — DELETE → `204` (resuelve #6)

`res.status(204).end()` en deletes que no devuelven recurso.

## Referencias

- REST API design — Microsoft REST API Guidelines: https://github.com/microsoft/api-guidelines
- RFC 7807 problem+json — https://datatracker.ietf.org/doc/html/rfc7807
- Stripe Idempotency-Key pattern — https://stripe.com/docs/api/idempotent_requests
- MercadoPago webhook signature validation — https://www.mercadopago.com/developers/en/docs/your-integrations/notifications/webhooks
- API versioning strategies — https://www.mnot.net/blog/2012/12/04/api-evolution
- JSON:API spec (filtros y paginación estandarizados) — https://jsonapi.org/
