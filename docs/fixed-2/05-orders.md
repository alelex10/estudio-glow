# Orders / Order History — User Perspective Audit

Project: `estudio-glow`
Audited paths (FE/BE):
- `frontend/app/routes/orders/orders.tsx`
- `frontend/app/common/services/orderService.ts`
- `frontend/app/common/constants/order.constants.tsx`
- `frontend/app/common/components/admin/OrderDetailModal.tsx`
- `backend/src/routes/orders.ts`
- `backend/src/routes/users.ts` (the actual user-facing endpoints)
- `backend/src/controller/order.ts`
- `backend/src/services/OrderService.ts`
- `backend/src/services/CronService.ts`
- `backend/src/docs/orders.ts`

---

## Overview

The "orders" feature, **from the logged-in user's perspective**, is essentially read-only history:

- Two backend endpoints that the user can actually call:
  - `GET /users/orders` → paginated list of their own orders (`backend/src/routes/users.ts:12`).
  - `GET /users/orders/:id` → single order with items, with ownership check (`backend/src/routes/users.ts:13`, `backend/src/controller/order.ts:55-70`).
- Everything else under `/orders/*` (`backend/src/routes/orders.ts`) is admin-only: list all, get any by id, approve, reject. The user has zero access to those.
- The frontend route `/orders` (`frontend/app/routes/orders/orders.tsx`) renders the list, status-tab filter (client-side only), pagination, payment receipt link (image), and a detail modal with items.
- Order status lifecycle is entirely **system-driven**: created in checkout, marked PAID by Mercado Pago webhook, marked EXPIRED by a cron job. There is no user-driven action on an existing order — no cancel, no re-order, no tracking, no refund, no invoice.

Statuses defined (`backend/src/models/order.ts:9`): `PENDING`, `PAID`, `PENDING_VERIFICATION`, `CANCELLED`, `EXPIRED`. There is **no** `SHIPPED` or `DELIVERED` — fulfillment/shipping is not modelled.

---

## User Journeys

### J1. View order history

1. User logs in, opens the navbar link "Mis Ordenes" (`frontend/app/common/constants/routes.ts:45`).
2. Route `/orders` loads. `loader` calls `requireAuth` then `orderService.getUserOrders(page, limit, sortBy, sortOrder, token)` which hits `GET /users/orders?...` (`frontend/app/routes/orders/orders.tsx:20-37`, `frontend/app/common/services/orderService.ts:57-77`).
3. Server returns `{ data, pagination }` from `OrderService.getUserOrders` (`backend/src/services/OrderService.ts:156-179`).
4. UI renders a table with columns: ID (first 8 chars), date (dd/mm/yy hh:mm), payment method badge, amount, status badge, "Ver Imagen" link to `receiptUrl` (transfer receipts only), and a "Ver Productos" button (`frontend/app/routes/orders/orders.tsx:93-173`).
5. User can change page size (10/25/50) and page; both trigger `window.location.href = ...` full reloads (`frontend/app/routes/orders/orders.tsx:66-77`).

### J2. Filter by status

1. User clicks a `StatusTabs` chip: ALL, Verificación, Pagadas, Pendientes, Canceladas, Expiradas (`frontend/app/common/constants/order.constants.tsx:37-44`).
2. `handleStatusFilter` writes `status=` to the URL and does a **full page reload** (`frontend/app/routes/orders/orders.tsx:55-64`).
3. After the reload, the loader **does NOT forward `status` to the API** (`frontend/app/routes/orders/orders.tsx:25-37` — `status` is read but never passed). The list is filtered **client-side, after pagination** (`frontend/app/routes/orders/orders.tsx:51-53`). See Issues H1.

### J3. View order detail (items)

1. User clicks "Ver Productos" on a row.
2. Component sets `selectedOrder` to the row (so the modal opens immediately with header info) and calls `orderService.getOrderDetail(order.id)` → `GET /users/orders/:id` (`frontend/app/routes/orders/orders.tsx:79-91`, `frontend/app/common/services/orderService.ts:43-48`).
3. Backend re-fetches order, verifies `order.userId === req.user.id` (403 otherwise) and returns `OrderWithItems` (`backend/src/controller/order.ts:55-70`, `backend/src/services/OrderService.ts:148-154`).
4. `OrderDetailModal` renders: short id, date, status badge, payment badge, "ID de Usuario" (the user's own id, truncated — useless to the user), product list with image (Cloudinary), qty x price, line totals, order total (`frontend/app/common/components/admin/OrderDetailModal.tsx:79-178`).

### J4. View payment receipt (TRANSFER only)

- The list shows a "Ver Imagen" link if `order.receiptUrl` is set; opens the raw Cloudinary URL in a new tab (`frontend/app/routes/orders/orders.tsx:142-159`).
- For MERCADO_PAGO orders this column always shows `—` because no receipt image exists.

### J5. Automatic status transitions (no user action)

Created → `PENDING` (MP) or `PENDING_VERIFICATION` (TRANSFER) at checkout (`backend/src/services/OrderService.ts:55-56`).
`expiresAt` set to **now + 15 min for MP**, **now + 48 h for TRANSFER** (`backend/src/services/OrderService.ts:48-53`).

Transitions the user can observe:
- → `PAID`: only via Mercado Pago webhook on `approved` payment, using `external_reference` (`backend/src/routes/webhooks.ts:34-36`, `backend/src/services/OrderService.ts:100-102`). TRANSFER orders are NOT moved to PAID by webhook — only admin approval does that (`backend/src/controller/order.ts:72-85`).
- → `CANCELLED`: only via admin reject endpoint (`backend/src/controller/order.ts:87-95`). Stock is returned in `OrderService.cancelOrder` (`backend/src/services/OrderService.ts:104-146`).
- → `EXPIRED`: cron tick every 60 s finds non-terminal orders with `expiresAt < now`, runs `cancelOrder` (which returns stock) and then OVERWRITES status to `EXPIRED` (`backend/src/services/CronService.ts:35-50`, `backend/src/repositories/OrderRepository.ts:216-229`). The user just sees the order flip from PENDING/PENDING_VERIFICATION to EXPIRED. See Issues H3.

---

## What Works

- **Authorization on detail**: `getUserOrderById` correctly checks ownership and returns 403 if the order is not the caller's (`backend/src/controller/order.ts:63-65`).
- **List scoping**: `getUserOrders` filters by `req.user.id` server-side (`backend/src/controller/order.ts:39-53`, `backend/src/services/OrderService.ts:156-166`). Users cannot see others' orders through this path.
- **Pagination & sort**: `page`, `limit`, `sortBy` (`createdAt` | `totalAmount`), `sortOrder` are validated by `PaginationOrderQuerySchema` (`backend/src/schemas/order.ts`) and used in `OrderRepository.findByUserId` (`backend/src/repositories/OrderRepository.ts:142-158`).
- **Stock integrity on cancel/expire**: `cancelOrder` runs in a transaction and refunds stock per item, and guards against double-cancel via terminal-status check (`backend/src/services/OrderService.ts:104-146`).
- **Cron concurrency**: `expireOrdersTick` is wrapped in a Postgres advisory lock so multiple instances don't double-process (`backend/src/services/CronService.ts:11-33`).
- **Webhook idempotency**: MP webhook deduplicates by `paymentId` before marking paid (`backend/src/routes/webhooks.ts:25-29`).
- **Empty state**: `DataTable` shows "No tienes pedidos con este filtro." when list is empty (`frontend/app/routes/orders/orders.tsx:196`).
- **Status & payment visual language**: `STATUS_CONFIG` and `PAYMENT_CONFIG` provide consistent badge colors/icons (`frontend/app/common/constants/order.constants.tsx:4-35`).
- **Detail modal**: loads items lazily, shows skeleton while loading, shows clean per-line and total amounts (`frontend/app/common/components/admin/OrderDetailModal.tsx:109-176`).

---

## Issues Found

### CRITICAL

**C1. Server-side status filter is silently ignored on the list endpoint.**
`GET /users/orders` calls `OrderService.getUserOrders` (`backend/src/controller/order.ts:39-53`), which only forwards `page/limit/sortBy/sortOrder` (`backend/src/services/OrderService.ts:156-166`). `OrderRepository.findByUserId` has no `status`/`paymentMethod` filtering either (`backend/src/repositories/OrderRepository.ts:142-158`). Combined with the FE filtering only the current page client-side (`frontend/app/routes/orders/orders.tsx:51-53`), the "filter by status" feature is **broken**: if the user has 30 orders and selects "Pagadas" while on a 10-row page that has zero PAID rows, the UI shows "empty state" even though paid orders exist on page 2/3. The FE comment acknowledges this: `// Filtrar órdenes por estado localmente (ya que el backend getUserOrders no filtra por estado)`.

**C2. No way for a user to cancel their own pending order.**
There is no `DELETE /users/orders/:id` or equivalent. `OrderService.cancelOrder` exists (`backend/src/services/OrderService.ts:104-146`) but is only exposed via the **admin** `rejectOrder` (`backend/src/controller/order.ts:87-95`, `backend/src/routes/orders.ts:17`). A user with a PENDING_VERIFICATION transfer order who changes their mind cannot release stock — they must wait 48 h for the cron to expire it.

### HIGH

**H1. Status tab triggers a full page reload but does not push the filter to the API.**
`handleStatusFilter` does `window.location.href = url.toString()` (`frontend/app/routes/orders/orders.tsx:55-64`). The loader reads `status` (`frontend/app/routes/orders/orders.tsx:25`) but never forwards it (`frontend/app/routes/orders/orders.tsx:29-35`). React Router 7 has `useNavigate`/`<Form>`/`<Link>` for client navigation; the full reload is also a UX regression. Same anti-pattern in `handlePageChange` and `handlePageSizeChange` (`frontend/app/routes/orders/orders.tsx:66-77`).

**H2. `getOrdersPaginated` (admin) is the only function that takes a `status` param but the user-facing `getUserOrders` never accepted it.**
`frontend/app/common/services/orderService.ts:17-41` accepts `status` and `paymentMethod`; `frontend/app/common/services/orderService.ts:57-77` does not. So even if the FE wanted to pass `status` to the user list, the service forces it out. Needs a signature change to fix C1.

**H3. Race window between `cancelOrder` and `setStatus("EXPIRED")` inside `expireOrdersTick`.**
`expireOrdersTick` does `await OrderService.cancelOrder(order.id)` (which itself transactionally sets status to `CANCELLED`) and then does a **separate, non-transactional** `db.update(...).set({ status: "EXPIRED" })` (`backend/src/services/CronService.ts:39-45`). If anything fails between the two, the order ends up `CANCELLED` (not `EXPIRED`) — observable to the user as a wrong terminal state. Also, the second update has no `WHERE status IN (...)` guard, so an admin who manually approves an order in the same tick could see the approval clobbered to `EXPIRED`.

**H4. TRANSFER orders cannot transition to `PAID` automatically.**
The MP webhook path (`backend/src/routes/webhooks.ts:34-36`) is the only automatic path to PAID. For TRANSFER, `PENDING_VERIFICATION` → `PAID` requires admin to call `POST /orders/:id/approve` (`backend/src/controller/order.ts:72-85`). If the admin does nothing for 48 h, the cron will EXPIRE the order even if the user already paid by transfer and uploaded a valid receipt. From the user's perspective this is silent data loss of their payment intent.

### MEDIUM

**M1. No status filter for `PENDING_VERIFICATION` accuracy in tabs.**
`STATUS_OPTIONS` exposes "Verificación", "Pagadas", "Pendientes", "Canceladas", "Expiradas" (`frontend/app/common/constants/order.constants.tsx:37-44`). Fine semantically, but because of C1 + H1 the tabs don't actually filter the dataset, only the current page. Users will believe data is missing.

**M2. Receipt URL is a raw Cloudinary link, not a "comprobante" experience.**
`receiptUrl` is shown as "Ver Imagen" and just opens the image (`frontend/app/routes/orders/orders.tsx:142-159`). There is no concept of an invoice / fiscal receipt (factura) at all. For MP-paid orders the column is permanently `—`.

**M3. Order id is shown truncated everywhere with no way to copy the full id.**
List and modal use `order.id.slice(0, 8).toUpperCase()` (`frontend/app/routes/orders/orders.tsx:99`, `frontend/app/common/components/admin/OrderDetailModal.tsx:69`). If a user needs to reference an order with support, there is no UI affordance to copy the full uuid.

**M4. Modal shows "ID de Usuario" to the user.**
`OrderDetailModal` renders the user's own truncated id (`frontend/app/common/components/admin/OrderDetailModal.tsx:96-99`). It is an admin field leaking into a customer view — the modal is shared with admin (note the path `components/admin/OrderDetailModal.tsx`). Should be hidden in the user context.

**M5. Loader awaits the list with no `try/catch`; any 401/500 throws.**
`orderService.getUserOrders` swallows 404 by returning an empty pagination (`frontend/app/common/services/orderService.ts:73-76`) but lets every other error bubble. The route has no `ErrorBoundary` defined. A network blip on `/orders` shows the default RR error UI instead of an empty list with retry.

**M6. Date column hardcodes en-US numeric formatting in the list and es-AR in the modal.**
List uses manual `dd/mm/yy, HH:mm` (`frontend/app/routes/orders/orders.tsx:106-114`); modal uses `toLocaleDateString("es-AR", ...)` (`frontend/app/common/components/admin/OrderDetailModal.tsx:44-53`). Inconsistent.

**M7. `totalAmount` is stored as `integer` (cents? whole units?).**
Model: `totalAmount: integer(...)` (`backend/src/models/order.ts:11`). FE just runs `Number(...).toLocaleString(...)` (`frontend/app/routes/orders/orders.tsx:124-133`). If the intent is cents, the user sees the wrong number; if whole pesos, precision below 1 ARS is impossible. No comment in code clarifies the unit.

### LOW

**L1. Re-renders via `window.location.href`.**
Pagination, page size, and status filter all do hard reloads (`frontend/app/routes/orders/orders.tsx:55-77`). Should be `useNavigate` / `<Link>` to stay within RR's loader/transition model.

**L2. Sort UI is missing.**
The loader accepts `sortBy` / `sortOrder` (`frontend/app/routes/orders/orders.tsx:26-27`), and the API supports them (`backend/src/schemas/order.ts`), but there is no FE control to change them. The user is stuck with `createdAt desc`.

**L3. OpenAPI under-documents the user-facing endpoints.**
`backend/src/docs/orders.ts` only documents the admin endpoints under `/orders`. The actual customer paths `/users/orders` and `/users/orders/:id` are not described anywhere — see also `backend/src/docs/users.ts` (untracked). External clients can't discover them.

**L4. Detail modal uses `order: OrderWithItems | null` but the parent passes either `orderWithItems` (full) or `selectedOrder` (row, no items) (`frontend/app/routes/orders/orders.tsx:200-208`).**
Type contract is silently violated; the `items` array is absent during the loading window. The modal handles this via `!order.items || order.items.length === 0` (`frontend/app/common/components/admin/OrderDetailModal.tsx:125`) which conflates "loading" with "empty order". `isLoading` is declared in props (`frontend/app/common/components/admin/OrderDetailModal.tsx:31`) but never passed from `orders.tsx` — the skeleton path is dead code.

**L5. `MercadoPagoService.createPreference` is called with `order.totalAmount`** (`backend/src/routes/checkout.ts:32`) but the user-side view has no link back to the MP payment preference if they abandoned the redirect. There is no "Pagar ahora" affordance on a `PENDING` order in the list.

**L6. Cancelling a TRANSFER receipt link leaks Cloudinary URL pattern indefinitely.**
The signed/unsigned status of `receiptUrl` is not visible in the code path here, but the URL is rendered with `target="_blank"` without `rel="noopener"` augmentation beyond `noreferrer` (which is fine) — minor.

---

## Missing Features (from the user's perspective)

- **Cancel my own order** (PENDING / PENDING_VERIFICATION). High-value, low effort.
- **Re-order** (one-click "buy again" that re-populates the cart with the same items at current prices). Trivial on top of `getOrderDetail`.
- **Tracking / shipment status**. There is no `SHIPPED` / `DELIVERED` status, no carrier, no tracking code, no shipping address linked to the order. The shop is effectively pickup-only or undefined.
- **Refunds**. No model, no endpoint, no FE.
- **Invoice / fiscal receipt (factura)** download (PDF). Only the user-uploaded transfer image exists.
- **Server-side status filter** for `GET /users/orders` (fixing C1/H1/H2).
- **Server-side payment method filter** for the user list (the admin list has it; the user list doesn't).
- **Date range filter** ("show orders from last 30 days / 6 months / year").
- **Search by order id**. With truncated ids in the UI, a user cannot find a specific order without scrolling.
- **Resume payment**: on a `PENDING` MP order, surface `preferenceUrl` again so the user can finish paying instead of waiting for expiry.
- **Resend / re-upload receipt** for a TRANSFER order that admin rejected.
- **Email / push notification** on status change (PAID, EXPIRED, CANCELLED). Nothing in the code indicates this exists.
- **Order timeline / history** ("Created 10:00, Payment received 10:04, Shipped...").
- **Sortable columns / sort UI** in the FE (the API supports it; the UI does not expose it).

---

## File References

Frontend
- `frontend/app/routes/orders/orders.tsx` — list page, loader, filter/pagination handlers, columns, modal trigger
- `frontend/app/common/services/orderService.ts` — `getUserOrders`, `getOrderDetail`, `getOrdersPaginated` (admin), `getAdminOrderDetail`
- `frontend/app/common/constants/order.constants.tsx` — `STATUS_CONFIG`, `PAYMENT_CONFIG`, `STATUS_OPTIONS`
- `frontend/app/common/constants/routes.ts:18,45` — `ROUTES.ORDERS` and navbar entry "Mis Ordenes"
- `frontend/app/common/components/admin/OrderDetailModal.tsx` — items list, totals, status/payment badges
- `frontend/app/common/components/admin/StatusTabs.tsx` — filter chips
- `frontend/app/common/components/admin/StatusBadge.tsx`, `PaymentBadge.tsx` — visual badges
- `frontend/app/routes.ts:23` — route registration

Backend
- `backend/src/routes/users.ts:12-13` — actual customer-facing endpoints (`GET /users/orders`, `GET /users/orders/:id`)
- `backend/src/routes/orders.ts` — admin-only endpoints (list, get, approve, reject, stats)
- `backend/src/controller/order.ts:39-70` — `getUserOrders`, `getUserOrderById` (ownership check at L63-65)
- `backend/src/controller/order.ts:72-95` — admin `approveOrder` / `rejectOrder`
- `backend/src/services/OrderService.ts:10-98` — `createOrder` (stock decrement, expiresAt)
- `backend/src/services/OrderService.ts:100-102` — `markOrderPaid`
- `backend/src/services/OrderService.ts:104-146` — `cancelOrder` (refunds stock)
- `backend/src/services/OrderService.ts:156-179` — `getUserOrders` (no status filter — see C1)
- `backend/src/services/CronService.ts:35-65` — expiry tick + advisory lock (see H3)
- `backend/src/repositories/OrderRepository.ts:142-158,216-229` — user list query, expired query
- `backend/src/routes/checkout.ts:27-53` — order creation paths (MP / TRANSFER)
- `backend/src/routes/webhooks.ts:15-41` — MP webhook → `markOrderPaid`
- `backend/src/models/order.ts:6-23` — `order` + `order_item` schema, status enum (no SHIPPED/DELIVERED)
- `backend/src/schemas/order.ts` — `PaginationOrderQuerySchema` (supports status/paymentMethod, but ignored on user list)
- `backend/src/docs/orders.ts` — OpenAPI for admin endpoints only (see L3)
