# Resumen Ejecutivo — Relevamiento Funcional desde la Perspectiva del Usuario

**Fecha:** 2026-05-15
**Método:** auditoría estática (sin ejecución), 6 subagentes especializados, uno por área funcional.
**Alcance:** estado real de las funcionalidades que un usuario (cliente o admin) puede usar hoy.

## Informes detallados

| # | Área | Archivo |
|---|------|---------|
| 1 | Autenticación | [01-auth.md](./01-auth.md) |
| 2 | Navegación de productos | [02-product-browsing.md](./02-product-browsing.md) |
| 3 | Carrito y favoritos | [03-cart-favorites.md](./03-cart-favorites.md) |
| 4 | Checkout y pagos | [04-checkout-payments.md](./04-checkout-payments.md) |
| 5 | Órdenes (historial) | [05-orders.md](./05-orders.md) |
| 6 | Panel de administración | [06-admin-panel.md](./06-admin-panel.md) |

---

## Veredicto general

El proyecto tiene **infraestructura de backend de calidad enterprise** (HMAC en webhooks, idempotencia, transacciones, advisory locks, server-side price authority) pero **la experiencia de usuario está fracturada en varios puntos críticos que impiden completar el journey básico de compra**.

El gap más significativo es la **desconexión entre lo que el backend ofrece y lo que el frontend usa**:

- MercadoPago: backend completo → UI deshabilitada.
- Cart endpoints: backend completo → frontend nunca los llama.
- Filtros por estado en órdenes: backend acepta el parámetro → repositorio lo ignora.
- Role check: backend valida → frontend admin no lo aplica.

Esto sugiere que el proyecto evolucionó por capas (primero el backend, después el frontend) sin un cierre de bucle. El resultado: **un usuario real no puede comprar con tarjeta, no puede paginar productos, pierde la sesión cada 15 minutos, y si paga por transferencia depende de la aprobación manual de un admin que no puede ver quién depositó**.

---

## Bloqueadores críticos del journey de compra

Ordenados por el orden en que un usuario los encontraría:

### 1. Sesión expira cada 15 minutos (Auth)
`frontend/app/common/services/session-storage.ts:5` define cookie de 15 min mientras el JWT del backend dura 7 días. Sin refresh. **Un usuario que tarda más de 15 minutos eligiendo productos será deslogueado al ir al checkout.**

### 2. No se puede paginar el catálogo (Productos)
`/products` ignora la metadata de paginación. El `PaginationFooter` existe pero está reservado al admin. **A partir del producto 12, el catálogo es invisible.**

### 3. Add-to-cart sin feedback (Carrito)
Al tocar "Agregar", no hay toast, no abre drawer, no anima. **Los usuarios harán doble-tap o asumirán que está roto.**

### 4. Carrito solo en localStorage (Carrito)
Backend `/cart`, `/cart/sync`, `/cart/:productId` completos pero el frontend nunca los invoca. **Cero sincronización entre dispositivos, cero recuperación si limpian cache.**

### 5. MercadoPago deshabilitado en UI (Checkout)
`checkout.tsx:195` con label "No disponible por el momento". El único camino real es transferencia bancaria — y el CBU mostrado es `0000000000000000000000`. **Hoy es imposible pagar por la app.**

### 6. Sin captura de dirección de envío (Checkout)
No existe tabla `addresses`, no hay formulario, no hay cálculo de envío (sidebar dice "Gratis" hardcodeado). **El comercio no puede despachar nada.**

### 7. Sin página de confirmación (Checkout)
- MP: sin `back_urls`/`auto_return` → el usuario queda varado en MercadoPago.
- Transferencia: redirige a HOME con un toast. El `orderId` devuelto se descarta.

**El usuario nunca recibe número de pedido. Tampoco hay email de confirmación.**

### 8. Filtro de órdenes roto (Órdenes)
El parámetro `status` se envía al backend pero el repositorio lo ignora (`OrderRepository.findByUserId` no recibe filtros). El frontend filtra sólo la página actual. **Un usuario buscando "Pagadas" verá "vacío" mientras sus pedidos pagos están en la página 2.**

### 9. Usuario no puede cancelar su propia orden (Órdenes)
`cancelOrder` existe en backend pero sólo se expone vía `rejectOrder` admin. **Un usuario con una transferencia pendiente que se arrepiente queda atrapado hasta que se ejecute el cron de expiración (48 h).**

---

## Patrones sistémicos detectados

Estos son problemas que aparecen en más de un área y reflejan decisiones arquitectónicas a revisar.

### A. Backend implementa, frontend no consume

| Área | Backend listo | Frontend lo usa |
|------|---------------|-----------------|
| Cart sync (`/cart/*`) | ✅ completo | ❌ nunca lo llama |
| MercadoPago (HMAC, preference, webhook) | ✅ completo | ❌ botón deshabilitado |
| Filtros en órdenes (status, paymentMethod) | ✅ schema | ❌ repo los descarta |
| Role en `/auth/verify` | ✅ devuelve role | ❌ admin layout sólo chequea token |
| Search con price-range | ✅ endpoint | ❌ catálogo sin UI |

**Causa probable:** el backend se diseñó con visión enterprise y el frontend se construyó después con shortcuts. **Recomendación:** una sola feature flag o checklist de "wiring" antes de cerrar cada PR.

### B. Datos visibles ≠ datos reales

- Sidebar de checkout: "Gratis" hardcoded, "Calculado al checkout" pero nada se calcula.
- Dashboard admin: widget "Valor Total de Ventas" muestra `sum(price * stock)` (valor de inventario).
- Meta description de `/products` dice "Panel de administración de Glow Studio".
- Modal de detalle de orden muestra "ID de Usuario" en lugar del email del cliente.
- `OrdersStats` cuenta sólo la página actual, no el total global.

**Riesgo:** decisiones de negocio tomadas con KPIs incorrectos.

### C. Defensa en profundidad ausente

- Frontend admin no chequea role → cualquier cliente logueado entra al shell admin (el backend bloquea las mutaciones, pero la UI filtra).
- CSRF middleware exige `X-Requested-With` pero el SSR helper no lo manda (necesita verificación runtime — puede estar 403'ando login/register).
- `markOrderPaid` no cross-checkea `(orderId, userId, amount)` con el webhook (mitigado por HMAC, pero capa única).
- `app.set("trust proxy")` ausente → rate-limit buckets comparten IP del proxy.
- Idempotency store en memoria → no sirve en múltiples instancias.

### D. Modelo de fulfillment inexistente

No hay envío, no hay tracking, no hay carrier, no hay factura fiscal, no hay estados `SHIPPED`/`DELIVERED`, no hay address book, no hay notificaciones por email. **El sistema modela "cobrar" pero no "entregar".** Esto bloquea operación real.

### E. Formato de pesos argentinos inconsistente

- Cards: `${price.toFixed(2)}` → "$1500.00"
- Detalle: `${price}` → "$1500"
- Ningún uso de `Intl.NumberFormat("es-AR")` → sin separador de miles.

`totalAmount` se guarda como `integer` sin unidad documentada (¿centavos? ¿pesos enteros?).

---

## Funcionalidades faltantes que un usuario espera

Resumen de lo que NO existe en el código (no es UX rota: directamente no está):

**Cuenta:**
- Recuperación de contraseña
- Verificación de email
- Página de perfil / edición
- Vinculación de Google a cuenta existente
- "Remember me" / sesión larga
- Eliminación de cuenta
- 2FA / logout-all-devices

**Catálogo:**
- Búsqueda global en header
- Filtro por precio en UI
- Sort por más recientes
- Galería de imágenes / zoom
- Productos relacionados
- Breadcrumbs
- Páginas de categoría
- Reviews / ratings
- Contador de resultados
- Skeletons
- Chips de filtros activos
- "Avisame cuando haya stock"
- OG tags / SEO por producto
- SKU

**Carrito / Favoritos:**
- Persistencia server-side de carrito
- Merge de carrito guest → user al loguearse
- "Mover a favoritos" desde carrito
- "Agregar al carrito" desde favoritos

**Checkout:**
- Guest checkout
- Captura de dirección de envío
- Address book
- Cálculo real de envío
- Cálculo de impuestos
- Múltiples métodos de pago activos
- Página de éxito / confirmación
- Email de confirmación
- Cupones / descuentos

**Órdenes:**
- Cancelación por el usuario
- Re-comprar (re-order)
- Solicitud de reembolso
- Tracking / estado de envío
- Descarga de factura/recibo
- Notificaciones de cambio de estado

**Admin:**
- Gestión de usuarios
- Datos de cliente en órdenes (nombre, email)
- Reembolsos
- Fulfillment / envíos
- Cupones
- Reportes de ventas con rango de fechas
- Búsqueda por ID de orden / cliente
- Acciones masivas
- Import/export CSV
- Múltiples imágenes por producto
- Variantes
- Flag activo/inactivo en producto
- Slugs / orden / anidamiento de categorías
- Configuración de tienda
- Audit log

---

## Cosas que SÍ funcionan bien

Para no perder perspectiva — la base es sólida en muchos puntos:

- **Webhook MercadoPago**: HMAC + fail-closed + clock-skew tolerance + constant-time compare + idempotencia por unique constraint en `payment_id`.
- **Server-side price authority**: precios siempre leídos de DB, nunca del cliente.
- **Stock-safe transactional operations** en cancel, approve, reject.
- **Cron de expiración con advisory lock** (`OrderService` + `CronService`).
- **Filtros del catálogo en URL** (shareables, refresh-safe, back/forward correcto).
- **Favoritos**: optimistic con rollback, sync server-side al cargar layout.
- **Ownership checks** en endpoints sensibles (`GET /users/orders/:id` → 403 si no es dueño).
- **Backend authorization consistente** en mutaciones de product/category/order.
- **Cloudinary `f_auto,q_auto,w_n`** aplicado consistentemente.
- **Stock badges** con colores correctos, quantity selector con clamping.

---

## Recomendaciones priorizadas (orden sugerido de trabajo)

### Sprint inmediato — "que se pueda comprar"
1. Alinear duración de cookie con JWT del backend (auth #1).
2. Reactivar MercadoPago en UI + agregar `back_urls`/`auto_return` (checkout #5, #7).
3. Reemplazar CBU placeholder o quitar opción transferencia hasta tener uno real (checkout).
4. Página de confirmación con número de orden + email de confirmación (checkout #7).
5. Conectar `PaginationFooter` al `/products` público (productos #2).
6. Toast/drawer al hacer add-to-cart (carrito #3).

### Sprint 2 — "que se pueda entregar"
7. Captura de dirección + cálculo de envío (checkout #6).
8. Conectar frontend a endpoints `/cart/*` o eliminar el código muerto (carrito #4).
9. Arreglar filtro de status en `/users/orders` (órdenes #8).
10. Endpoint user-facing de cancelación (órdenes #9).
11. Modelo de fulfillment: `SHIPPED`/`DELIVERED`, tracking, address.
12. Mostrar email/nombre de cliente en admin de órdenes.

### Sprint 3 — "que sea seguro y operable"
13. Role check en admin layout (admin — defense in depth).
14. Recuperación de contraseña (auth — bloqueante para usuarios reales).
15. Arreglar `SalesValue` widget (admin — KPI incorrecto).
16. `Intl.NumberFormat("es-AR")` global para precios.
17. Corregir meta descriptions públicas (SEO).
18. Verificar runtime que CSRF no esté bloqueando login/register.

---

## Notas sobre el método

- Cada subagente leyó el código de forma independiente, sin ejecutar la app, sin compartir contexto entre ellos. Los hallazgos transversales (sección "Patrones sistémicos") emergieron al sintetizar los 6 informes.
- No se consultaron documentos previos en `docs/fixed/` para evitar sesgos heredados.
- Hallazgos marcados como "necesita verificación runtime" (CSRF en SSR, idempotency en memoria) deben validarse con la app corriendo antes de actuar.
- Algunos juicios sobre UX se basan en lectura estática y pueden suavizarse al probar el flujo real.
