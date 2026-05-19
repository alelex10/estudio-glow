# Pendientes Funcionales — Estudio Glow

> Documento consolidado de issues pendientes después de limpiar los audits `fixed-2` y `fixed-3`.
> Fecha de consolidación: 2026-05-17.
> Excluye: todos los items marcados como ✅ resueltos en los audits originales (infraestructura backend, sesión 15 min, MP UI, bugs operacionales, pagos MP, frontend UX 3.1–3.11, arquitectura 4.1–4.3/4.5/4.6/4.7/4.10, seguridad 5.4/5.5/5.7/5.9).

---

## Resumen por severidad

| Severidad | Cantidad |
|-----------|----------|
| Critical  | 1 |
| High      | 20 |
| Medium    | 39 |
| Low       | 37 |

---

## 1. Auth

| # | Severidad | Archivo / Línea | Descripción |
|---|-----------|-----------------|-------------|
| 1 | High | `frontend/app/common/services/authApi.server.ts:95` + `login.tsx:64` | Google login 409 (cuenta LOCAL existente) se muestra como error genérico transitorio. El usuario debería ver "usá tu contraseña". |
| 2 | High | `backend/src/controller/google.ts:67,156,277` | Account-linking prometido pero inexistente: los errores dicen "vinculá Google desde tu perfil" pero no hay página de perfil ni endpoint `/auth/link`. |
| 3 | High | `frontend/app/routes/auth/login.tsx` | No existe recuperación de contraseña. Un usuario que olvida su password queda bloqueado permanentemente (salvo Google). |
| 4 | Medium | `backend/src/controller/auth.ts:118` | User enumeration: el backend distingue "no existe una cuenta con este email" de "Credenciales inválidas", filtrando emails registrados. |
| 5 | Medium | `backend/src/schemas/auth.ts:6` + `register-action.tsx:18` | `confirmPassword` solo se valida en el cliente. El servidor acepta cualquier password sin confirmar. |
| 6 | Low | `frontend/app/actions/auth/logout.tsx:5-11` | Logout desde SSR action no envía la cookie `token`; el backend hace `clearCookie` sobre una sesión ausente. Funciona por accidente. |
| 7 | Low | `backend/src/schemas/auth.ts:20` | `RegisterSchema` expone campo opcional `role` que el controller ignora. Es un riesgo de escalada de privilegios en refactor futuro. |
| 8 | Low | `backend/src/routes/auth.ts:12` | Endpoint deprecado `POST /auth/google` sigue registrado y retorna `Warning: 299`. Código muerto activo. |
| 9 | Low | `frontend/app/common/components/button/GoogleLoginButton.tsx:64` | El ancho del botón de Google se lee una sola vez; si el contenedor arranca en 0 px (layout shift/animación), el botón queda invisible. |
| 10 | Low | `frontend/app/common/components/nav-bar/UserActions.tsx:26` | Botón de logout es un icono sin `aria-label` ni confirmación; clic accidental desloguea instantáneamente. |
| 11 | Low | `frontend/app/routes/auth/login.tsx` + `register.tsx` | No hay toggle "mostrar contraseña" ni indicador de Caps Lock en los inputs. |

---

## 2. Productos / Catálogo

| # | Severidad | Archivo / Línea | Descripción |
|---|-----------|-----------------|-------------|
| 1 | Critical — ✅ RESUELTO (`catalog-pagination`) | `frontend/app/routes/product/products.tsx:38-63` | La metadata de paginación (`products.pagination`) se devuelve pero nunca se renderiza. El catálogo se corta en los primeros 10 productos sin Next/Prev. **Resuelto**: `PaginationFooter` ya renderiza Next/Prev, números de página, y selector de tamaño. |
| 2 | High | `backend/src/routes/products.ts:19-21` + `routes/public.ts:8-9` | Los endpoints mutantes de productos comparten router con lecturas públicas; el prefijo `/public` está medio construido y no expone `GET /public/products/:id` ni `/news`. **No afecta al usuario directamente** — los endpoints admin tienen `requireAdmin`. Es deuda técnica de arquitectura. |
| 3 | High | `frontend/app/routes/home/home.tsx:20-41` | El hero de la home no tiene ningún CTA ni link al catálogo. El único camino es el navbar "Productos". |
| 4 | High | `frontend/app/common/components/Card.tsx:56` + `product.\$id.tsx:143` | Precios sin formato ARS consistente: `${price.toFixed(2)}` muestra `$1500.00` (sin separador de miles); en detalle muestra `$1500`. No se usa `Intl.NumberFormat("es-AR")`. |
| 5 | High | `frontend/app/common/components/search-filter/SearchFilter.tsx` | Existe componente de búsqueda global con debounce, pero no se usa en ninguna página pública (home, detail, header). |
| 6 | High | `frontend/app/routes/product/product.\$id.tsx` | Sin productos relacionados / "Otros de esta categoría" en la página de detalle. El usuario no tiene camino alternativo si no compra. |
| 7 | High | `frontend/app/routes/product/product.\$id.tsx:36-38` + `product/layout.tsx:20` | 404 de producto lanza `throw new Error(...)` sin `ErrorBoundary` exportado; el usuario ve el error chrome por defecto de RR v7. |
| 8 | High | `frontend/app/common/services/productService.ts:52-55` | Si el backend devuelve 404, `productService` lo traga y devuelve `emptyPagination()`. El usuario ve "No hay productos" aunque el problema es un error de backend. |
| 9 | Medium | `frontend/app/routes/product/product.\$id.tsx:118-123` | Solo una imagen por producto; sin galería ni zoom. El modelo DB solo guarda un `imageUrl`. |
| 10 | Medium | `frontend/app/common/components/Card.tsx:46` + `product.\$id.tsx:121` | Sin `onError` fallback en imágenes; si Cloudinary falla, el navegador muestra ícono de imagen rota. |
| 11 | Medium | `frontend/app/routes/home/home.tsx:33` + `product/layout.tsx:89` | Estados de carga son textos crudos (`<div>Cargando productos...</div>`, `<div>Loading...</div>` en inglés). El componente `LoadingState` existe pero solo se usa en admin. |
| 12 | Medium | `backend/src/schemas/product.ts:154-181` | `PaginationProductQuerySchema` no incluye `minPrice`/`maxPrice`; el endpoint de búsqueda sí los soporta pero el catálogo no los expone. |
| 13 | Medium | `frontend/app/routes/product/product.\$id.tsx:146` | El ícono `Star` siempre está iluminado y sin rating real. Es UX engañosa; no existe modelo de reviews. |
| 14 | Medium | `frontend/app/common/constants/routes.ts: NAV_LINKS` | El link "Mis Ordenes" se muestra a usuarios no autenticados en navbar y mobile drawer. |
| 15 | Medium | `frontend/app/common/components/nav-bar/MobileDrawer.tsx:101-116` | Entrada "Carrito" tiene estilo disabled (`opacity-50 cursor-not-allowed`, `title="Próximamente"`) pero igual navega a `/cart`. Señal contradictoria. |
| 16 | Medium | `frontend/app/routes/product/products.tsx:8` + `product.\$id.tsx:25` | `meta.description` dice "Panel de administración de Glow Studio" en páginas públicas. Regresión SEO. |
| 17 | Medium | `frontend/app/common/components/product-filter/FilterSideBar.tsx` + `FilterDrawer.tsx` | Lógica duplicada casi textualmente (238 vs 234 líneas). Cualquier cambio requiere editar ambos; alto riesgo de drift. |
| 18 | Medium | `frontend/app/routes/product/layout.tsx:29-30` + `backend/src/schemas/product.ts:156-162` | Defaults de sort inconsistentes: frontend `name/asc`, backend `createdAt`. El usuario no ve nada resaltado al cargar. |
| 19 | Low | `frontend/app/routes/product/product.\$id.tsx:4` + `product/layout.tsx:3` | Imports no usados (`ChevronDown`). |
| 20 | Low | `frontend/app/routes/home/home.tsx:27` | `<img>` decorativa sin heading accesible a los lados. |
| 21 | Low | `frontend/app/common/components/ProductCarousel.tsx:14` | `useBreakpoint` recalcula en cada render; al cambiar de breakpoint el carousel salta al índice 0. |
| 22 | Low | `frontend/app/common/components/ProductCarousel.tsx:64` | Usa `key={index}` en vez de `key={product.id}`. |
| 23 | Low | `frontend/app/common/components/ProductCarousel.tsx:45,87` | Clases `disabled:\${colorDisabled}` por template literal; Tailwind JIT no las extrae dinámicamente. |
| 24 | Low | `frontend/app/common/components/Card.tsx:33` | El `<Link>` de la card envuelve todo; `FavoriteButton` no previene navegación al clickear el corazón. |
| 25 | Low | `frontend/app/routes/product/layout.tsx:41-47` | El sort popover solo se cierra al clickear un item; no se ve handler `onClickOutside` en el call site. |
| 26 | Low | `backend/src/repositories/ProductRepository.ts:210` | Endpoint `search` limita a 10 productos hard-coded. El frontend nunca lo consume. |

---

## 3. Carrito / Favoritos

| # | Severidad | Archivo / Línea | Descripción |
|---|-----------|-----------------|-------------|
| 1 | Critical — ✅ RESUELTO (`cart-server-sync`) | `backend/src/routes/cart.ts:1-13` | Backend `/cart/*` completo pero el frontend nunca lo llama. Carrito es solo `localStorage`; cero sync entre dispositivos para usuarios logueados. **Resuelto**: implementado carrito híbrido — guests usan `localStorage`, usuarios autenticados persisten en servidor vía endpoints granulares (`POST /cart/items`, `PATCH /cart/items/:productId`) con sync al login. |
| 2 | Critical — ✅ RESUELTO (batch-1) | `frontend/app/common/components/nav-bar/MobileDrawer.tsx:101-116` | Link de carrito en mobile drawer tiene apariencia de deshabilitado (`opacity-50`, `title="Próximamente"`) aunque la ruta funciona. **Resuelto**: removidos estilos disabled, agregado badge de conteo. |
| 3 | High | `frontend/app/common/components/Card.tsx:26-29` + `product.\$id.tsx:59-69` | Add-to-cart es silencioso: sin toast, sin abrir drawer, sin animación. El usuario hace doble-tap o asume que no funcionó. |
| 4 | High | `frontend/app/common/context/CartContext.tsx:126-128` | `updateQuantity` retorna `prev` sin cambios si `quantity > stock`, sin toast ni feedback visual. |
| 5 | High | `frontend/app/common/context/CartContext.tsx:138-161` | `refreshStock` está exportado pero nunca se invoca. El stock puede quedar stale durante una sesión larga. |
| 6 | High | — | No hay reconciliación de carrito guest → user al loguearse. Login no pulla carrito server; logout no empuja local. |
| 7 | High | `frontend/app/common/components/button/FavoriteButton.tsx` + `Card.tsx:58` | Invitado que toca favorito recibe toast "Iniciá sesión" pero sin redirección a login ni cola para después. Dead-end de UX. |
| 8 | Medium | `backend/src/routes/cart.ts:9-11` | Backend carece de `PATCH /cart/:productId`; para actualizar cantidad hay que hacer `POST /cart/sync` (replace-all). |
| 9 | Medium | `backend/src/services/CartService.ts:47-61` | `syncCart` hace `DELETE` + loop `INSERT` sin transacción. Si falla a la mitad, el carrito queda vacío o parcial. |
| 10 | Medium | `frontend/app/common/context/FavoritesContext.tsx:68` | `isLoading` global bloquea toggles simultáneos de productos distintos. Solo se puede togglear un favorito a la vez en toda la UI. |
| 11 | Medium | `frontend/app/routes/favorites/favorites.tsx:25-30` + `layout.tsx:21-26` | Los loaders de favoritos tragan errores y devuelven `[]`; un 500 se ve igual que "sin favoritos". |
| 12 | Medium | `frontend/app/routes/favorites/favorites.tsx:67-113` + `cart/CartItemsList.tsx` | No hay cross-actions: "Mover a favoritos" desde carrito ni "Agregar al carrito" desde favoritos. |
| 13 | Medium | `frontend/app/common/context/CartContext.tsx:67` | Si falla la API de stock al montar, fallback a `stock: 999`. El usuario puede pedir 999 unidades y el checkout fallará server-side. |
| 14 | Medium | `frontend/app/common/components/cart/OrderSummarySidebar.tsx:18` + `cart.tsx:26` | `totalItems` suma cantidades, no productos distintos. Muestra "5 productos" cuando hay 1 producto con qty 5. |
| 15 | Low | `frontend/app/common/components/button/FavoriteButton.tsx:7` | Prop `productId: UUID` pero consumidores pasan `string`; tipado inconsistente con `CartItem`. |
| 16 | Low | `frontend/app/common/components/cart/CartItemsList.tsx:46-49` | Label "Stock disponible: N" muestra stock total del producto, no stock restante considerando el carrito. |
| 17 | Low | `frontend/app/common/context/CartContext.tsx` + `FavoritesContext.tsx` | Providers no exponen error state; la UI no puede mostrar banner si la persistencia falla. |
| 18 | Low | `frontend/app/common/components/Drawer.tsx:86` | Panel fijo a `w-80`; en tablets se ve comprimido. |
| 19 | Low | `frontend/app/common/components/nav-bar/CustomerLinks.tsx:21-28` | Sin `aria-live` al cambiar el contador del carrito; screen readers no anuncian "agregado". |
| 20 | Low | `backend/src/controller/favorite.ts:35-37` | 409 en favorito duplicado genera toast genérico "Error al actualizar favoritos" en vez de "Ya está en favoritos". |

---

## 4. Checkout / Pagos

| # | Severidad | Archivo / Línea | Descripción |
|---|-----------|-----------------|-------------|
| 1 | Critical — ✅ RESUELTO (`checkout-result`) | `frontend/app/routes/checkout/checkout.tsx:235-236` | CBU de transferencia es placeholder `0000000000000000000000` (22 ceros). Alias `ESTUDIO.GLOW` también hardcodeado. Un usuario real transferiría a una cuenta inexistente. |
| 2 | Critical — ✅ RESUELTO (`checkout-result`) | `frontend/app/routes/checkout/checkout.tsx:138-140` | No existe página de confirmación / éxito. Transferencia redirige a HOME con un toast; MP redirige a una pantalla genérica (aunque `back_urls` ya existen, falta la página destino). **Resuelto**: `result.tsx` (320 líneas) renderiza vista para todos los estados (PAID, PENDING, PENDING_VERIFICATION, EXPIRED, CREATED) con order ID, items, y total. |
| 3 | Critical — ✅ RESUELTO (`checkout-result`) | `frontend/app/routes/checkout/checkout.tsx:83,112` | El `orderId` devuelto por el backend se descarta en la action. El usuario nunca ve un número de pedido. **Resuelto**: `checkout.tsx` captura `orderId` y navega a `/checkout/result?orderId=...`. |
| 4 | Medium | `backend/src/models/order.ts:10` + `frontend/app/common/components/cart/OrderSummarySidebar.tsx:19` | `totalAmount` es `integer` sin unidad documentada (¿pesos enteros? ¿centavos?). El frontend usa `.toFixed(2)`, lo que sugiere pesos enteros con decimales siempre `.00`. |
| 5 | Medium | `backend/src/services/MercadoPagoService.ts:13-26` | Preference de MP no incluye `currency_id: "ARS"` explícito. |
| 6 | Medium | `backend/src/routes/checkout.ts:29-33` + `MercadoPagoService.ts:8` | La preferencia de MP crea un solo ítem opaco (`"Pedido Estudio Glow #..."` × 1) en vez de los productos reales con cantidades. |
| 7 | Medium | `frontend/app/routes/checkout/checkout.tsx:37` | `paymentMethod` se lee como `string` sin validación Zod; cualquier valor que no sea `"MERCADO_PAGO"` cae por default a transferencia. |
| 8 | Medium | `frontend/app/routes/checkout/checkout.tsx:129-144` | Race window: el carrito se limpia client-side ANTES del redirect a MP. Si el redirect falla, el usuario queda en `/checkout` con carrito vacío y sin link a la orden. |
| 9 | Medium | `backend/src/middleware/file-validation.ts:11-32` | Validación de recibo confía en `file.mimetype` del browser; sin magic-byte check. Un `.exe` renombrado puede pasar. |
| 10 | Medium | `frontend/app/common/components/cart/OrderSummarySidebar.tsx:25-28` | Línea "Impuestos: Calculado al checkout" es falsa; nunca se calcula nada. |
| 11 | Medium | `frontend/app/common/components/cart/OrderSummarySidebar.tsx:46-51` | Texto "Pago seguro y protegido" con candado en el flujo de transferencia manual. UX engañosa. |
| 12 | Low | `backend/src/models/order.ts:12` | `receiptUrl` tiene límite `varchar(255)`. URLs de Cloudinary con transformaciones pueden excederlo. |
| 13 | Low | `frontend/app/routes/checkout/checkout.tsx:126,129-144` | Uso de `useRef` + `processedActionData` para dedupear effect sobre `actionData`. Code smell; debería retornar objeto fresco. |
| 14 | Low | `backend/src/routes/checkout.ts:31` | `metadata.title` de MP preference incluye prefijo del `order.id`; debería usar número opaco de comprador. |

---

## 5. Órdenes

| # | Severidad | Archivo / Línea | Descripción |
|---|-----------|-----------------|-------------|
| 1 | Critical — ✅ RESUELTO (`orders-status-filter`) | `frontend/app/routes/orders/orders.tsx:25-37` + `backend/src/services/OrderService.ts:156-166` | El parámetro `status` se lee del loader pero nunca se envía al backend. El filtro de tabs corre client-side sobre la página actual, ocultando órdenes reales en otras páginas. **Resuelto**: `status` viaja de punta a punta (URL → Zod → controller → service → repo → SQL). `countByUserId` aplica el mismo filtro para `totalItems` correcto. Eliminado workaround `filteredOrders` client-side. Bonus: migrado `window.location.href` → `useSearchParams`. |
| 2 | High | — | No existe endpoint user-facing para cancelar una orden propia. `OrderService.cancelOrder` solo se expone vía admin `rejectOrder`. Un usuario atrapado en transferencia pendiente debe esperar 48 h al cron. |
| 3 | High — ✅ RESUELTO (bonus `orders-status-filter`) | `frontend/app/routes/orders/orders.tsx:55-64` + `orders.tsx:66-77` | Tabs de status y controles de paginación usan `window.location.href = ...`, provocando full reload en vez de navegación client-side de RR v7. **Resuelto**: migrado a `useSearchParams` + `setSearchParams`. |
| 4 | High | `frontend/app/common/services/orderService.ts:57-77` | `getUserOrders` no acepta `status`/`paymentMethod` aunque `getOrdersPaginated` (admin) sí. Bloquea C1 aunque el backend lo soporte. |
| 5 | High | `backend/src/controller/order.ts:72-85` | Transferencias `PENDING_VERIFICATION` → `PAID` requieren aprobación manual de admin. Si el admin no actúa en 48 h, el cron expira la orden aunque el usuario ya haya pagado y subido comprobante. |
| 6 | Medium | `frontend/app/common/constants/order.constants.tsx:37-44` | Los tabs de status no filtran realmente (por C1); el usuario cree que no tiene órdenes cuando solo están en otra página. |
| 7 | Medium | `frontend/app/routes/orders/orders.tsx:142-159` | `receiptUrl` se abre como link crudo a Cloudinary; no hay concepto de recibo fiscal ni descarga. |
| 8 | Medium | `frontend/app/routes/orders/orders.tsx:99` + `admin/OrderDetailModal.tsx:69` | El ID de orden se trunca a 8 chars (`slice(0,8)`) en lista y modal; no hay forma de copiar el UUID completo para soporte. |
| 9 | Medium | `frontend/app/common/components/admin/OrderDetailModal.tsx:96-99` | Muestra "ID de Usuario" (UUID truncado del propio usuario) en la vista de cliente. Campo de admin filtrado a la vista incorrecta. |
| 10 | Medium | `frontend/app/routes/orders/orders.tsx:20-37` | Loader sin `try/catch`; errores 401/500 explotan al error boundary por defecto de RR v7. |
| 11 | Medium | `frontend/app/routes/orders/orders.tsx:106-114` + `OrderDetailModal.tsx:44-53` | Formato de fecha inconsistente: lista usa manual `dd/mm/yy`, modal usa `toLocaleDateString("es-AR")`. |
| 12 | Low | `frontend/app/routes/orders/orders.tsx:55-77` | Re-renders por `window.location.href` en lugar de `useNavigate` / `<Link>`. |
| 13 | Low | `frontend/app/routes/orders/orders.tsx` | No hay UI para cambiar `sortBy` / `sortOrder`; el usuario queda atascado en `createdAt desc`. |
| 14 | Low | `backend/src/docs/orders.ts` | Solo documenta endpoints admin `/orders/*`; los paths reales del cliente `/users/orders` y `/users/orders/:id` no están en OpenAPI. |
| 15 | Low | `frontend/app/routes/orders/orders.tsx:200-208` + `OrderDetailModal.tsx:31,125` | `selectedOrder` (sin items) se pasa al modal mientras carga; el skeleton nunca se muestra porque `isLoading` no se pasa desde `orders.tsx`. |
| 16 | Low | `backend/src/routes/checkout.ts:32` + `services/MercadoPagoService.ts` | Órdenes `PENDING` de MP no tienen botón "Pagar ahora" en la lista; el `preferenceUrl` se pierde después del checkout. |
| 17 | Low | `frontend/app/routes/orders/orders.tsx:142-159` | Links a Cloudinary usan `target="_blank"` con `rel="noreferrer"`; sin `noopener` explícito (menor, ya cubierto por noreferrer moderno). |

---

## 6. Admin Panel

| # | Severidad | Archivo / Línea | Descripción |
|---|-----------|-----------------|-------------|
| 1 | High | `frontend/app/routes/admin/layout.tsx:18-44` | El layout de admin solo hace `requireAuth` (chequeo de token) pero NUNCA valida `role === "admin"`. Cualquier cliente logueado puede renderizar el shell admin; las mutaciones fallan 403, pero la UI filtra datos y estructura. |
| 2 | High | `frontend/app/routes/admin/dashboard/page.tsx:52-54` + `dashboard.ts:67-72` | Widget `SalesValue` muestra `sum(price * stock)` (valor de inventario) pero su etiqueta dice "Valor Total de Ventas". KPI crítico incorrecto. |
| 3 | High | `frontend/app/common/components/admin/OrderDetailModal.tsx:96-98` + `admin/order/order.tsx:119-167` | Admin no puede ver email/nombre del cliente en órdenes. El modal muestra `userId.slice(0,8)`; operativamente no sabe quién depositó. |
| 4 | High | — | No existe reembolso / reversión de orden `PAID`. No hay endpoint, UI, ni estado `REFUNDED`. |
| 5 | Medium | `frontend/app/routes/admin/order/components/OrdersStats.tsx:10-12` | Las estadísticas de estado (Verificación/Pagadas/Canceladas) cuentan solo la página actual, no el total global. Inconsistencia visual. |
| 6 | Medium | `backend/src/routes/orders.ts:12` | `GET /orders/stats` apunta a `getProductStats` (dashboard) en vez de stats reales de órdenes. No existe handler de order-stats. |
| 7 | Medium | `frontend/app/routes/admin/dashboard/page.tsx:30` | "Productos Recientes" pide `page=1&limit=5` sin `sortBy=createdAt`, así que devuelve por `name ASC`. Título engañoso. |
| 8 | Medium | `frontend/app/common/components/admin/AdminLayout.tsx:27` | Regex `^/admin/products/\d+$` nunca matchea UUIDs de producto. El título de edición siempre cae al default "Admin". |
| 9 | Medium | `frontend/app/common/components/admin/sidebar/Sidebar.tsx:131-132` | Sidebar hardcodea "Admin / Administrador" en vez de mostrar el nombre/email real del usuario logueado. |
| 10 | Low | `frontend/app/routes/admin/category/category.\$id.tsx:30-71` | Edición de categoría usa fetch client-side + submit client-side en vez de loader/action de RR v7. Inconsistente con el resto del admin. |
| 11 | Low | `frontend/app/routes/admin/order/order.tsx:88,99` | Approve/Reject usan `window.confirm` + `alert(...)` en vez de `ConfirmModal` + toast usados en el resto del admin. |
| 12 | Low | `frontend/app/routes/admin/order/order.tsx:44` | El loader lee `paymentMethod` de la URL pero no hay UI de filtro para ese parámetro. |
| 13 | Low | `frontend/app/routes/admin/order/order.tsx:67-69,119-167` | Uso masivo de `any` en estados y handlers de órdenes. Sin type safety. |
| 14 | Low | `frontend/app/common/components/admin/sidebar/Sidebar.tsx:31` | Ícono de "Pedidos" reusa el `Box` de Productos; confusión visual menor. |
| 15 | Low | `frontend/app/routes/admin/product/product.new.tsx:85-93` | Toast de éxito en creación de producto corre por `useEffect`; re-submit rápido puede disparar `navigate` dos veces. |
| 16 | Low | `frontend/app/routes/admin/category/categories.tsx:64` | El toast de error en delete categoría muestra mensaje genérico; el backend devuelve el count de productos asociados que se pierde. |
| 17 | Low | `backend/src/controller/dashboard.ts:67-72` | `sql<number>` puede devolver string según el driver; el frontend hace `value.toLocaleString` que rompería si es string. Requiere verificación runtime. |

---

## 7. Frontend / UX General

> Nota: la mayoría de los issues frontend cross-cutting ya quedaron agrupados en las áreas funcionales anteriores. Esta sección queda vacía intencionalmente tras la limpieza de `fixed-3/03-frontend-ux` (items 3.1–3.11 resueltos). El único item restante (`3.12` CSRF token injection) se movió a `seguridad.md` por ser de seguridad.

*(Sin items pendientes en esta área.)*

---

## 8. Backend / Tests / Arquitectura

| # | Severidad | Archivo / Línea | Descripción |
|---|-----------|-----------------|-------------|
| 1 | High | `backend/src/services/OrderService.ts`, `CronService.ts`, `WebhookEventService.ts`, etc. | Cobertura de tests crítica inexistente. Solo existe `csrf.test.ts`. Faltan tests de concurrencia (`createOrder` stock=1, dos promesas), `markOrderPaid` sobre orden `EXPIRED`, `recordOrSkip` dedup, `verifyMpWebhook` HMAC, idempotencia concurrente. |
| 2 | Medium | `backend/src/repositories/OrderRepository.ts:82-86,95-99,173-184` + `ProductRepository.ts:213-215` + `OrderService.ts:67,92,123,143` | Casts `as typeof query`, `as any`, `tx as unknown as typeof db` desactivan el tipado de Drizzle. Debería usarse patrón `conditions[]` + `and(...)` y tipar transacciones con el genérico correcto (`PgDatabase | PgTransaction`). |
| 3 | Medium | `backend/vitest.config.ts` | Configuración existe pero solo hay 1 archivo de test. La suite no se ejerce en la práctica. |
