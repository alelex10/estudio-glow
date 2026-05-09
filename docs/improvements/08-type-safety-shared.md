# 8. Type Safety y Sincronización Front-Back

## Estado actual

- Backend: schemas Zod 4 con `@asteasolutions/zod-to-openapi` y generador de spec en `backend/src/docs/openapi.ts:34`. Tipos exportados desde Zod (`backend/src/schemas/product.ts:196-201`: `ProductResponse`, `PaginationQuery`, etc.).
- Backend: Drizzle ORM en `backend/src/models/*.ts` (referencia inferible en lectura).
- Frontend: tipos manuales en `frontend/app/common/types/{product,user,response,category,dashboard}.ts`.
- Frontend: schemas Zod **propios** en `frontend/app/common/schemas/{auth,categorySchema}.ts` — duplicados respecto al backend.
- Frontend: `tsconfig.json` con `"strict": true` (línea 25). Sin `noUncheckedIndexedAccess`, sin `exactOptionalPropertyTypes`, sin `noImplicitOverride`.
- **No existe paquete compartido**, ni monorepo workspace, ni codegen vía OpenAPI/openapi-typescript, ni `openapi-fetch`. El backend genera el spec OpenAPI pero el frontend NO lo consume (búsqueda confirmó: ni `openapi-fetch` ni `openapi-typescript` están en `package.json` de ningún lado).

## Problemas detectados

### 1. CRÍTICO — Tipos del frontend desincronizados con el backend
**Severidad: ALTA**

`frontend/app/common/types/product-types.ts:7` define `description: string`. Pero `backend/src/schemas/product.ts:78` define `description: z.string().nullable()`. Cualquier producto sin descripción rompe el tipo del frontend en runtime — TypeScript dice `string`, JSON dice `null`. Ya está el bug latente.

`frontend/app/common/types/product-types.ts:11` → `imageUrl: string`. Backend `product.ts:109` → `imageUrl: z.string().nullable()`. Mismo problema.

`frontend/app/common/types/product-types.ts:24` define `ProductResponse extends Product { category: { id, name } }`. Backend (`ProductWithCategoryResponseSchema`, línea 90) define `category` como **nullable**. Otra discrepancia.

**Impacto**: tipos mienten. El compilador da falsa seguridad.

### 2. CRÍTICO — Schemas Zod duplicados con divergencia
**Severidad: ALTA**

- Backend `RegisterSchema` (`backend/src/schemas/auth.ts:6-25`): `password: z.string().min(6)`. Frontend `registerSchema` (`frontend/app/common/schemas/auth.ts:10-18`): `password.min(1).min(6)` + `confirmPassword`. La frontend tiene `confirmPassword` que el backend no espera — bien aislado, pero el resto del schema duplica reglas que pueden divergir.
- Backend `CreateProductSchema` (`backend/src/schemas/product.ts:7-35`) vs frontend `getProductSchema` (`frontend/app/common/components/admin/ProductForm.tsx:26-40`). Reglas paralelas: si backend agrega `name.max(255)` y frontend no, el usuario verá rechazo al submit que no detectó el form.
- Backend `categorySchema` y frontend `categorySchema` (`frontend/app/common/schemas/categorySchema.ts:7-18`): ambos validan name 1-100 y description 0-500 hoy. Mantenerlos en sync es trabajo manual frágil.

### 3. CRÍTICO — `any` invasivo en orderService y rutas de orders
**Severidad: ALTA**

- `frontend/app/common/services/orderService.ts` declara 5 `any` (líneas 5, 34, 44, 51, 70). El servicio NO tipa `Order`, `OrderItem`, `OrderStatus`, `PaymentMethod`.
- `frontend/app/routes/admin/order/order.tsx`: `selectedOrder: any`, `orderWithItems: any`, columnas con `(order: any) =>` (líneas 128-172), `handleAction`/`handleViewDetail` tipados `any`.
- `frontend/app/routes/orders/orders.tsx`: ídem.

Es la zona más crítica del producto (pagos, aprobación) y está sin tipos. Un cambio de nombre de campo en backend pasa silencioso.

### 4. ALTO — `User` tipo inconsistente
**Severidad: MEDIA**
- Frontend `User` (`frontend/app/common/types/user-types.ts:11-17`) define `role: "admin" | "customer"` (lower).
- Backend `UserResponseSchema` (`backend/src/schemas/auth.ts:54`): `z.enum(["admin", "customer"])` — coincide.
- Pero `BackendGoogleLoginResponse.user.role` (`frontend/app/common/types/response.ts:75`) duplica la definición. Una de las tres divergerá.

### 5. ALTO — `ApiResponse<T>` vs `ResponseSchema<T>` vs `MessageResponse` — tres tipos similares
**Severidad: MEDIA**
`frontend/app/common/types/response.ts:4-8` → `ApiResponse<T>` (data?, message?, error?).
Línea 33-37 → `ResponseSchema<T>` (data?, message?). Comentario `// error?: string` indica eliminación incompleta.
Línea 28-31 → `MessageResponse` (message, user?).
Tres formas de responder. El backend probablemente devuelve un solo formato — alinearlo.

### 6. ALTO — `Stats` definido dos veces
**Severidad: MEDIA**
`frontend/app/common/types/product-types.ts:16-22`: `{ total, lowStock, outOfStock, categories, totalValue }`.
`frontend/app/common/types/dashboard.ts:1-7`: `{ total, lowStock, totalCategory, withoutStock, totalValue }`. **Nombres distintos** (`outOfStock` vs `withoutStock`, `categories` vs `totalCategory`). Bug latente garantizado: el componente que importa de `dashboard.ts` no compila contra el endpoint si el backend devuelve el formato del otro.

### 7. ALTO — `tsconfig.json` no maximiza strictness
**Severidad: MEDIA**
`frontend/tsconfig.json:25`: `"strict": true` ✅.
Faltan:
- `"noUncheckedIndexedAccess": true` — `arr[i]` debería ser `T | undefined`. Hoy NO lo es; bugs de "undefined is not a function" en runtime.
- `"exactOptionalPropertyTypes": true` — distingue `{ x?: T }` de `{ x: T | undefined }`.
- `"noImplicitOverride": true`.
- `"noFallthroughCasesInSwitch": true`.
- `"forceConsistentCasingInFileNames": true`.

### 8. MEDIO — Drizzle no aporta sus tipos al frontend
**Severidad: MEDIA**
`drizzle-orm` infiere `InferSelectModel<typeof products>` para el back. Esos tipos NO viajan al front. Si fueran un paquete compartido, las queries del backend serían fuente de verdad de las shapes públicas (filtrando lo privado).

### 9. MEDIO — OpenAPI generado pero no consumido
**Severidad: MEDIA**
`backend/src/docs/openapi.ts` genera el spec. Sin embargo, el frontend NO usa `openapi-typescript` ni `openapi-fetch`. Es trabajo desperdiciado: el backend ya tiene la fuente de verdad, falta el último paso de consumo.

### 10. BAJO — `import type { UUID } from "crypto"` en código de cliente
**Severidad: BAJA (pero feo)**
`frontend/app/common/types/product-types.ts:1`, `CartContext.tsx:9`. `crypto.UUID` es un tipo de Node — no hace daño en TS porque solo viaja como tipo, pero conceptualmente está mal: el cliente no debería depender del módulo `crypto` de Node. Definir un alias propio: `type Uuid = \`${string}-${string}-${string}-${string}-${string}\``.

## Recomendaciones — Estrategia priorizada

### Prioridad 1 — Detener la divergencia (semana 1)

1. **Eliminar tipos duplicados del frontend** que ya existen en backend, sustituyéndolos por importaciones desde el spec.

2. **Workspace pnpm/bun** + paquete `packages/shared` con los schemas Zod canónicos:
   ```
   /
   ├── packages/
   │   └── shared/
   │       ├── package.json   { "name": "@glow/shared", "exports": { ".": "./src/index.ts" } }
   │       └── src/
   │           ├── product.ts  // RE-EXPORTA los schemas del backend o los mueve aquí
   │           ├── auth.ts
   │           └── ...
   ├── backend/   import from "@glow/shared"
   └── frontend/  import from "@glow/shared"
   ```
   Si refactor de monorepo es muy invasivo, alternativa más liviana: paso 3.

3. **Sin monorepo: codegen OpenAPI**.
   ```bash
   # frontend
   bun add -d openapi-typescript openapi-fetch
   ```
   ```jsonc
   // frontend/package.json scripts
   "gen:api": "openapi-typescript ../backend/openapi.json -o app/common/types/api.gen.ts"
   ```
   Backend expone `GET /openapi.json` (ya existe el generador, falta serializar a archivo) o ejecutar `bun run -- bun src/docs/dump.ts > openapi.json` antes de cada build.

   Y consumir con `openapi-fetch`:
   ```ts
   // frontend/app/common/config/api-client.ts
   import createClient from "openapi-fetch";
   import type { paths } from "~/common/types/api.gen";
   export const api = createClient<paths>({ baseUrl: API_BASE_URL });
   // uso:
   const { data, error } = await api.GET("/products/{id}", { params: { path: { id } } });
   ```
   Ahora `data` y `error` están tipados desde el spec. Cualquier cambio en backend rompe el typecheck del frontend en CI — exactamente lo que se quiere.

### Prioridad 2 — Endurecer tsconfig

4. Agregar a `frontend/tsconfig.json`:
   ```jsonc
   "noUncheckedIndexedAccess": true,
   "exactOptionalPropertyTypes": true,
   "noImplicitOverride": true,
   "noFallthroughCasesInSwitch": true,
   "forceConsistentCasingInFileNames": true
   ```
   Esperar errores. Arreglar uno por uno (puede ser ~50). Vale la pena: `arr[0]` ya no es `T` mentiroso.

### Prioridad 3 — Desterrar `any` del dominio order

5. Definir en `backend/src/schemas/order.ts` los schemas `OrderResponseSchema`, `OrderItemSchema`, etc. (ya existe el archivo según el `find`, validar contenido). Exportar tipos.
6. Reemplazar todos los `any` de `orderService.ts`, `routes/orders/orders.tsx`, `routes/admin/order/order.tsx` por los tipos generados.

### Prioridad 4 — Unificar respuestas

7. Un único `ApiEnvelope<T>`:
   ```ts
   type ApiEnvelope<T> =
     | { ok: true; data: T }
     | { ok: false; error: { code: string; message: string; statusCode: number } };
   ```
   Adaptar backend (middleware de respuesta) y frontend a la vez. Simplifica `apiClient`: un solo `if (!result.ok) ...`.

### Prioridad 5 — Limpieza tipos misceláneos

8. Eliminar `Stats` duplicado: dejar uno solo en `dashboard.ts`, alinear nombres con backend (`outOfStock`, `categories`).
9. `import type { UUID } from "crypto"` → reemplazar por alias local `type Uuid = string`.
10. `frontend/app/common/types/common-type.ts` está vacío (0 líneas) — borrar.

## Ejemplo concreto: refactor de un endpoint

Antes (`frontend/app/common/services/orderService.ts:43`):
```ts
getOrderDetail = (id: string, token?: string) => apiClient<any>({ ... });
```

Después:
```ts
import type { paths } from "~/common/types/api.gen";
type OrderDetail = paths["/users/orders/{id}"]["get"]["responses"]["200"]["content"]["application/json"];

getOrderDetail = (id: string, token?: string) =>
  apiClient<OrderDetail>({ endpoint: API_ENDPOINTS.USER.ORDERS.DETAIL(id), token });
```

A partir de ese punto, el render del modal de detalle de orden no compila si el backend cambia el shape — bug detectado en CI, no en producción.

## Roadmap

| Semana | Entregable |
|---|---|
| 1 | OpenAPI dump + `openapi-typescript` + `openapi-fetch` setup. Primer endpoint migrado: `/products/:id`. |
| 2 | Migrar `orderService` y rutas de orders. Eliminar `any`. |
| 3 | Endurecer tsconfig. Arreglar errores. |
| 4 | Unificar `ApiEnvelope`. Eliminar `ResponseSchema`/`ApiResponse`/`MessageResponse` redundantes. |

## Referencias

- openapi-typescript + openapi-fetch: https://openapi-ts.dev/
- zod-to-openapi: https://github.com/asteasolutions/zod-to-openapi
- Drizzle InferModel: https://orm.drizzle.team/docs/goodies#type-api
- TypeScript strictest: https://www.typescriptlang.org/tsconfig#noUncheckedIndexedAccess
- TkDodo — Don't fight TypeScript: https://tkdodo.eu/blog/dont-fight-typescript
- Matt Pocock — Tipos compartidos en monorepo: https://www.totaltypescript.com/
