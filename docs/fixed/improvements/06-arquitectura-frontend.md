# 6. Arquitectura Frontend

Stack: React Router 7 SSR + React 19 + Tailwind v4 + react-hook-form + Zod + Lucide. SSR habilitado en `react-router.config.ts:8`. Preset Vercel.

## Estado actual

- Entrypoint SSR y `loader` global de usuario: `frontend/app/root.tsx:20`, `frontend/app/routes/layout.tsx:12`.
- Configuración de rutas centralizada (no file-based "auto"): `frontend/app/routes.ts:13` — bien estructurada con `layout()` + `prefix()`.
- Capa de servicios HTTP (clases singleton): `frontend/app/common/services/{productService,orderService,categoryService,favoriteService}.ts`.
- Cliente HTTP único: `frontend/app/common/config/api-client.ts:10` (con `console.log` en cada request, `:29`).
- Boundary servidor con sufijo `.server.ts`: `auth.server.ts`, `authApi.server.ts`, `session-storage.ts`. Correcto.
- Cookie de sesión httpOnly + signed: `session-storage.ts:7-17`. Bien.
- Cart en `localStorage` + Context: `frontend/app/common/context/CartContext.tsx`.
- Componentes propios: `Drawer.tsx`, `Popover.tsx`, `Toast.tsx`, `DataTable.tsx`, `OrderDetailModal.tsx`, `ConfirmModal.tsx`. No se usa Radix/shadcn.
- Tailwind v4 con `@theme` en `frontend/app/app.css:42` (tokens `--color-primary-*`). Correcto para v4.
- ErrorBoundary: solo en `root.tsx:64`. No hay por ruta.

## Problemas detectados

### 1. ALTO — `CartContext` ignora estado del servidor y no sincroniza
**Severidad: ALTA**
`frontend/app/common/context/CartContext.tsx:37-86`. El carrito vive en `localStorage` y al `mount` hace N llamadas (`Promise.all` línea 49) — N+1 al backend para refrescar stock por item, sin debounce ni cache. Comentario revelador en `:84`: "Optional: If user is authed, call sync API here." — TODO sin implementar. Race conditions: si el loader del producto trae stock=10 pero el contexto refresca a stock=2 de forma asíncrona, el componente puede mostrar UI inconsistente. Para usuarios autenticados con carrito en BD (existe `/cart/sync` y `/cart/:id` en `api-end-points.ts:64-68`), el contexto NO los carga al montar.

### 2. ALTO — `useEffect(() => { refreshStock() }, [])` con eslint-disable
**Severidad: MEDIA**
`frontend/app/routes/cart/cart.tsx:22-25`. La función `refreshStock` depende de `items` (`CartContext.tsx:138-161`) — la regla está suprimida. Cada montaje dispara N requests. Reemplazar por un `loader` server-side que retorne items con stock fresco.

### 3. ALTO — Container/Presentational mezclado
**Severidad: MEDIA**
- `frontend/app/routes/admin/order/order.tsx:66-265` — 200 LOC con estado local, `useRevalidator`, columnas, llamadas API directas (`apiClient` línea 94), modales y render. Es smart + dumb en un solo componente.
- `frontend/app/routes/checkout/checkout.tsx:29-95` — toda la lógica de pago en el componente de ruta.
- `frontend/app/routes/admin/product/products.tsx:59-257` — render + columnas + delete + filtros + drawer.
Patrón correcto: `routes/*.tsx` = container (loader + glue), componentes en `common/components/*` = presentacionales (sin fetch). Hoy los routes hacen todo.

### 4. ALTO — Tipos `any` proliferan en el dominio order
**Severidad: MEDIA**
`orderService.ts` declara 5 `any` (líneas 5, 34, 44, 51, 70). En `admin/order/order.tsx`, las columnas (`:128-172`) y handlers (`:69-122`) están todos tipados `any`. Lo mismo en `orders/orders.tsx:42-92`. Pierde la garantía de TypeScript justo donde está la lógica de pagos.

### 5. MEDIO — Servicios y actions duplican responsabilidades
**Severidad: MEDIA**
- `services/authApi.server.ts:8-30` (`serverLogin`) y `actions/auth/login-action.tsx:22` consumen el mismo endpoint. Bien delimitado.
- Pero `services/productService.ts:63-115` (`createProduct/updateProduct/deleteProduct`) recibe `token` como parámetro y se invoca tanto desde actions (server) como desde cualquier componente cliente potencialmente. La clase no tiene boundary `.server.ts` aunque la mayor parte de sus métodos son de admin. Tres opciones, en orden de mérito:
  1. Dividir en `productService.public.ts` (cliente seguro) + `productService.server.ts` (admin/token).
  2. Mover métodos admin a `actions/` y eliminar la clase.
  3. Aceptar que el servicio es agnóstico y NUNCA pasarle token desde el cliente — hoy se pasa desde loaders pero el riesgo es alto.

### 6. MEDIO — `console.log` en hot path de producción
**Severidad: BAJA-MEDIA**
`api-client.ts:29-33` loguea cada request con URL y método. En SSR esto contamina los logs de Vercel/Render con ruido caro. Quitar o gatear con `import.meta.env.DEV`.

### 7. MEDIO — Sin error boundary por ruta
**Severidad: MEDIA**
`root.tsx:64` es la única ErrorBoundary. Si falla el loader de `admin/order` o `cart`, todo el árbol se reemplaza por el error genérico. RR7 permite `export function ErrorBoundary` en cada `route.tsx`. Hoy `RouteError.tsx` y `ApiConnectionError.tsx` existen como componentes pero no se usan en ningún `ErrorBoundary` de ruta.

### 8. MEDIO — Falta `useNavigation` para indicador global de carga
**Severidad: BAJA**
No hay barra de progreso en navegaciones (`useNavigation().state === "loading"`). Usuarios no perciben feedback al pasar de `/products` a `/product/:id` con datos del loader. Skeletons existen para Suspense (`StatsGridSkeleton`, `ProductsSkeleton`) pero no para navegación.

### 9. MEDIO — Componentes propios que duplican Radix/shadcn (NIH)
**Severidad: BAJA**
- `common/components/Drawer.tsx`: 48 líneas, sin focus-trap, sin `Esc` key, sin `aria-modal`, scroll del body no se bloquea. Radix `Dialog` lo resuelve gratis.
- `common/components/Popover.tsx:14-34`: solo es un toggle de `<Button>`. No tiene `Escape`, ni `outside-click`, ni posicionamiento (Floating UI). Para 14 líneas pasa, pero crece a la primera necesidad.
- `Toast.tsx:60-66`: usa singleton `toastCallback` global — funciona pero no es testable y rompe en SSR si se llama antes del mount. `sonner` o `react-hot-toast` lo soluciona en 5 líneas.

### 10. MEDIO — Accesibilidad incompleta
- `Drawer.tsx`: sin `role="dialog"`, sin `aria-modal`, sin focus-trap, sin restauración de focus al cerrar.
- `OrderDetailModal`, `ConfirmModal`: revisar (no leídos en detalle pero misma raíz).
- `cart.tsx:31` muestra "0 productos" siempre como `<p>` sin `aria-live`, los cambios no se anuncian a lectores.
- Botones de cantidad en `product.$id.tsx:170-185` no tienen `aria-label` (`Plus`/`Minus` icon-only).

### 11. BAJO — Sin code-splitting para `/admin`
`routes.ts` carga estáticamente todas las rutas. RR7 hace splitting por ruta automáticamente — bien — pero no hay distinción entre el bundle público y el de admin. El `AdminLayout`, `DataTable`, `OrderDetailModal` son ~kB que muchos visitantes no necesitan. Validar con `react-router build --analyze` o `rollup-plugin-visualizer`.

### 12. BAJO — `getCloudinaryUrl` sin validación
`product.$id.tsx:108` usa `getCloudinaryUrl(product.imageUrl, 800)` pero `product.imageUrl` es `string` (puede venir vacío). Verificar `lib/utils.ts`.

### 13. BAJO — `ProductForm.tsx:71` usa `as any` en `zodResolver`
Workaround típico cuando el tipo del schema no matchea `useForm<T>`. Indica desalineación entre `ProductFormData` (línea 24) y el schema dinámico (`getProductSchema` línea 26). Debería ser `z.infer<ReturnType<typeof getProductSchema>>`.

## Recomendaciones

### Prioridad 1 — Separar container/presentational (semana 2)

3. Para cada ruta admin grande (>150 LOC): extraer un componente "view" en `common/components/admin/<feature>/<Feature>View.tsx` que recibe data + callbacks por props. La ruta queda con `loader`, `action`, y un `<View {...loaderData} onAction={fetcher.submit} />`.

4. Reglas de servicio:
   - `*.server.ts` → solo importable desde loaders/actions.
   - `productService.ts` cliente: solo métodos sin token (públicos).
   - Mover `createProduct`/`updateProduct`/`deleteProduct`/`getProductStats` a `productService.server.ts`.

### Prioridad 2 — Carrito sólido

5. Usar `useFetcher` para sincronizar carrito en lugar de `localStorage` + Context cuando el usuario está autenticado:
   ```tsx
   // CartContext: split into useGuestCart (localStorage) + useAuthedCart (loader-driven via revalidate)
   ```
   El servidor es la fuente de verdad para usuarios logueados.

6. Sustituir `useEffect(refreshStock)` por loader que devuelva `items` con stock real. Si el carrito sigue en localStorage, sincronizar al loader vía form GET con los IDs y hacer batch en backend (un solo endpoint `/products/batch?ids=...`).

### Prioridad 3 — Robustez

7. `ErrorBoundary` por ruta:
   ```tsx
   // routes/checkout/checkout.tsx
   export function ErrorBoundary() {
     const error = useRouteError();
     return <ApiConnectionError />;
   }
   ```

8. Indicador global de navegación en `Layout`:
   ```tsx
   const nav = useNavigation();
   {nav.state !== "idle" && <ProgressBar />}
   ```

9. Eliminar `console.log` en `api-client.ts:29`.

### Prioridad 4 — UI primitives

10. Reemplazar `Drawer.tsx`, `Popover.tsx`, eventualmente `Toast.tsx`, `OrderDetailModal`, `ConfirmModal` por **Radix UI primitives** + estilo Tailwind (no shadcn entero, solo lo que falta). Beneficio: a11y gratis, focus-trap, escape, ARIA. Costo: ~12kB gz por componente que ya están medio implementados a mano.

11. Aplicar `aria-label` a icon-buttons. Validar con axe-devtools.

### Prioridad 5 — Tipado fuerte (ver doc 08)

12. Eliminar todos los `any` de `orderService.ts` y rutas de orders. Definir `Order`, `OrderItem`, `OrderStatus` como tipos derivados del schema Zod del backend.

## Referencias

- React Router 7 SSR data flow: https://reactrouter.com/start/framework/data-loading
- Atomic Design — Brad Frost: https://atomicdesign.bradfrost.com/
- Container/Presentational pattern (Dan Abramov, 2019): https://medium.com/@dan_abramov/smart-and-dumb-components-7ca2f9a7c7d0
- Radix UI primitives: https://www.radix-ui.com/primitives
- Tailwind v4 `@theme`: https://tailwindcss.com/docs/v4-beta
- OWASP — Token Storage: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
