# Admin Panel Audit

> Scope: admin user perspective. Static read of code only. Excludes `/docs/fixed`.

## Overview

The admin panel lives under `/admin/*` in the frontend (React Router v7, file-based routes wired in `frontend/app/routes.ts:30-49`). It is served by a single layout (`frontend/app/routes/admin/layout.tsx`) that wraps four areas:

- **Dashboard** — product/inventory stats, recent products, quick actions
- **Products** — list / filter / create / edit / delete (with image upload)
- **Categories** — list / search / create / edit / delete
- **Orders** — list / filter by status / view detail / approve or reject pending verifications

There is **no Users area, no Roles area, no Settings/Store-Config area, no Refunds/Returns area, no Coupons, no Reports**. The sidebar (`frontend/app/common/components/admin/sidebar/Sidebar.tsx:13-39`) hardcodes only Dashboard / Productos / Categorías / Pedidos / Cerrar Sesión.

Backend admin endpoints are mounted at `/products`, `/categories`, `/orders/*`, `/dashboard/stats` (`backend/src/index.ts:102-110`). Write operations are gated by `authenticate + requireAdmin` middleware (`backend/src/middleware/auth.ts:47-55`).

---

## Access Control

### Backend (correctly guarded)

`requireAdmin` strictly compares `user.role === "admin"` and throws `AuthorizationError` otherwise (`backend/src/middleware/auth.ts:47-55`). It is applied to:

- `POST/PUT/DELETE /products` — `backend/src/routes/products.ts:19-21`
- `POST/PUT/DELETE /categories` — `backend/src/routes/categories.ts:18-20`
- `GET /orders`, `GET /orders/:id`, `POST /orders/:id/approve`, `POST /orders/:id/reject`, `GET /orders/stats` — `backend/src/routes/orders.ts:12-17`
- `GET /dashboard/stats` — `backend/src/routes/dashboard.ts:7`

Backend authorization is consistent. JWT payload carries `role` (`backend/src/middleware/auth.ts:6-10`) which is verified at every admin call.

### Frontend (BROKEN — no role check)

`frontend/app/routes/admin/layout.tsx:18-44` is the gatekeeper for the entire admin section. It does the following:

1. `requireAuth(request)` — only checks that a token exists (`frontend/app/common/actions/auth-helpers.ts:12-20`). **No role check.**
2. Calls `/auth/verify` to confirm the token is still valid; the endpoint returns `{ user: { id, name, email, role } }` (`backend/src/controller/auth.ts:164-183`) but the layout DISCARDS the role: it only checks `!data.user` and then reads `session.get("user")` from the cookie (lines 30-35).
3. There is no `if (user.role !== "admin") redirect(...)` anywhere in the layout or in the child loaders.

**Consequence**: any authenticated `customer` who navigates to `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders` gets the **entire admin UI rendered**. They cannot perform mutations (backend will return 403), but they can:

- See the dashboard widget values for the store (total products, low stock, totalValue) via `GET /dashboard/stats` — but wait, this endpoint is admin-only, so it will 401/403. The loader (`frontend/app/routes/admin/dashboard/page.tsx:25-33`) does not handle the error → the dashboard will render with `stats === undefined` and show zeros. The non-admin reaches the page anyway.
- See the products list (loaders use public `GET /products/paginated`) — no leak there.
- See the orders list — `GET /orders` is admin-gated so the loader will fail; React Router will show the route error boundary, but the layout/sidebar is still visible.
- See the sidebar that hardcodes "Admin" as the user (`Sidebar.tsx:131-132`) regardless of who is logged in.

**Severity: HIGH.** Hiding the UI behind a role check is standard and missing. Today the only thing protecting the data is that the listed-on-the-server endpoints check the role. There is no defense in depth on the frontend.

---

## Admin Journeys

### 1. Dashboard

**Entry**: `/admin` → `frontend/app/routes/admin/dashboard/page.tsx`

**What the admin sees** (top to bottom):

1. **StatsGrid** — 4 cards: Total Productos, Stock Bajo (≤10), Sin Stock (=0), Categorías. Backed by `GET /dashboard/stats` → `getProductStats` (`backend/src/controller/dashboard.ts:10-34`).
2. **InventoryValue** — total `sum(price * stock)` over all products (`backend/src/controller/dashboard.ts:67-72`).
3. **SalesValue** — `frontend/app/routes/admin/dashboard/components/SalesValue.tsx:7-32`. **Bug**: this is labelled "Valor Total de Ventas" but its `totalValue` prop is the SAME inventory-value number from `stats.totalValue` (`page.tsx:52-54`). The admin sees inventory dollars labelled as sales dollars.
4. **RecentProducts** — first 5 from `GET /products/paginated?page=1&limit=5` (`dashboard/page.tsx:30`, `RecentProducts.tsx`). Title says "Productos Recientes" but the data is the first page of the default-sorted list, NOT necessarily newest (depends on default `sortBy` — `backend/src/schemas/product.ts:157` defaults to `name` ASC). Misleading.
5. **QuickActions** — two links: "Agregar Producto" and "Ver Catálogo" (`QuickActions.tsx`).

**What works**: stats SQL is reasonable (uses `count()` and aggregated sum). Suspense + Await streaming pattern is implemented for each card.

**What is broken / poor UX**:

- SalesValue duplicates InventoryValue with a wrong label — see severity HIGH below.
- "Productos Recientes" is not actually sorted by date (severity MEDIUM).
- No revenue, orders-by-day, top-products, conversion, customers-count, or any sales-side metric. Dashboard is INVENTORY-only.
- No date range picker. The "Total Products" etc. are global counts — admin cannot see "this week".

---

### 2. Products

**Entry**: `/admin/products` → `frontend/app/routes/admin/product/products.tsx`

**Listing (`products.tsx:25-58, 169-258`)**:
- Loads paginated products + categories in parallel.
- Filter sidebar (desktop) / drawer (mobile) for category, stock-level, search text.
- DataTable columns: Imagen, Nombre, Categoría, Precio, Stock (stock color-coded — green/amber/red).
- Row click → edit page; row actions: Edit, Delete (with `ConfirmModal`).
- Pagination via query string. Backend supports `q`, `category`, `categoryId`, `stock` ("low"|"out"|"ok"), `sortBy`, `sortOrder` (`backend/src/schemas/product.ts:155-178`).

**Create (`product.new.tsx`)**:
- Form: name, description (optional), price, stock, category select, image (required). React-Hook-Form + Zod resolver in `ProductForm.tsx`.
- Submits multipart/form-data → action calls `productService.createProduct` → `POST /products`.
- Backend validates body, checks category exists, rejects duplicate name (`backend/src/controller/product.ts:81-113`).
- Image is required at create (`product.new.tsx:66-68` and `product.ts:94-96`). Uploaded to Cloudinary via `ImageUploadService.uploadProductImage`.
- On success: toast + navigate to `/admin/products`.

**Edit (`product.$id.tsx`)**:
- Loader fetches by ID; on miss throws 404 Response.
- Action accepts same fields; image is optional. If a new file is uploaded, `ImageUploadService.updateProductImage` replaces (passing the old `imageUrl`) — see `backend/src/controller/product.ts:126-133`.
- After update → redirect to `/admin/products`.

**Delete**: confirm modal → `POST /actions/product/delete/:id` (`frontend/app/actions/product/product-delete.$id.tsx`) → `DELETE /products/:id`. Cloudinary image is also deleted (`backend/src/controller/product.ts:162`).

**What works**: full CRUD, image upload+replace, server-side pagination, real backend filters that combine.

**What is broken / poor UX**:

- **Page title in AdminLayout is incomplete**: `pageTitles` only maps BASE, PRODUCTS, PRODUCTS_NEW (`AdminLayout.tsx:10-17`); also a regex `^/admin/products/\d+$` (line 27) that **NEVER matches** because product IDs are UUIDs (`crypto.randomUUID()` in `controller/product.ts:92`). So the edit-page header always shows "Admin" with no subtitle. Severity LOW–MEDIUM.
- No category list shown on the products page header (just "Nuevo Producto" CTA); the page heading and breadcrumb are inconsistent with other admin pages (Categories has "Categorías" h1, Products doesn't).
- The optimistic toast in `product.new.tsx` runs via `useEffect`. If the user resubmits quickly, `actionData?.success` from the previous submit still fires the navigate. Minor.
- Duplicate-name detection runs **before** image upload but **AFTER** category check; if name conflict is hit, no cleanup is needed (fine), but if Cloudinary fails mid-create, the response error is generic.
- No price/SKU/variant/multiple-images support. One image per product, period.
- No bulk delete, no bulk edit, no bulk stock-update.
- No CSV import/export.
- No "active/inactive" or "draft/published" flag — every product is immediately visible to customers.

---

### 3. Categories

**Entry**: `/admin/categories` → `frontend/app/routes/admin/category/categories.tsx`

**Listing (`categories.tsx:24-189`)**:
- Loads `GET /categories?q=...` (public list, no admin gate on read).
- Columns: Nombre (with description preview), Fecha de creación, Última actualización.
- Search by name via `?q=`. No pagination — assumes small list.
- Row actions: Edit, Delete (with `ConfirmModal`).

**Create (`category.new.tsx`)**:
- Form: name (required), description (optional). React-Hook-Form action submits → `POST /categories`.
- Backend rejects duplicate names with `ConflictError` (`controller/category.ts:91-93`).

**Edit (`category.$id.tsx`)**:
- **Inconsistent pattern**: this route does NOT use the React Router `loader`/`action` pair. Instead it does a client-side `useEffect` fetch and a client-side submit (`category.$id.tsx:30-71`). Every other admin route uses loader/action. Severity LOW (works, but inconsistent + can't SSR).

**Delete**: confirm modal → `POST /actions/category/delete/:id` → `DELETE /categories/:id`. Backend blocks deletion if products reference the category and returns `ConflictError` with the count (`controller/category.ts:185-194`).

**What works**: CRUD, server-side duplicate-name check, safe-delete with associated-products check, search.

**What is broken / poor UX**:

- No pagination on the category list. If a real store has 200 categories this falls over.
- No way to reorder categories (no `sortOrder` column in the model).
- No category image / icon / slug — purely name + description.
- No nested categories (flat structure).
- Edit page does client-side fetch instead of loader/action (inconsistent with the rest of admin).
- Delete error UX: server returns the count, but the toast (`categories.tsx:64`) only shows the generic message — the count is buried in `fetcher.data.error`. Severity LOW.

---

### 4. Orders

**Entry**: `/admin/orders` → `frontend/app/routes/admin/order/order.tsx`

**Listing (`order.tsx:35-260`)**:
- Loads `GET /orders?page&limit&status&paymentMethod&sortBy&sortOrder` via `orderService.getOrdersPaginated`.
- Header shows count of `PENDING_VERIFICATION` orders on the current page and a Refresh button.
- **OrdersStats cards**: Total órdenes (uses `pagination.totalItems` — correct), Verificación / Pagadas / Canceladas (these count from the CURRENT PAGE only — see Issues below).
- **StatusTabs**: All / PENDING_VERIFICATION / PAID / PENDING / CANCELLED / EXPIRED (`order.constants.tsx:37-44`).
- **DataTable** columns: ID (first 8 chars), Fecha (DD/MM/YY HH:mm), Pago (badge), Monto, Estado (badge).
- **Row actions**: open receipt URL (if exists), View detail (opens `OrderDetailModal`), Approve, Reject. Approve/Reject only render when `status === "PENDING_VERIFICATION"`.

**Approve / Reject (`order.tsx:86-103`)**:
- Uses `window.confirm(...)` then `apiClient` POST to `/orders/:id/approve` or `/orders/:id/reject`.
- On error uses `alert(...)`. (Other admin pages use the toast component — see Issues.)
- Backend: `approveOrder` checks current status is `PENDING_VERIFICATION` or `PENDING` then `OrderService.markOrderPaid` (`controller/order.ts:72-85`, `OrderService.ts:100-102`). `rejectOrder` calls `OrderService.cancelOrder` which restores stock in a transaction (`OrderService.ts:104-146`).

**Detail modal (`OrderDetailModal.tsx`)**:
- Shows status, masked user ID (first 8), items list with images, total.
- No customer email/name/address, no shipping info, no payment ID — only what is in the orders table.

**What works**:
- Pagination, status filter, refresh.
- Approve/Reject covers the manual-transfer verification flow correctly.
- Reject correctly restores product stock inside a DB transaction.
- Idempotent cancel: skips if already CANCELLED/EXPIRED/PAID (`OrderService.ts:113-119`).

**What is broken / poor UX**:

- **Stats counts are page-scoped, not global**: `OrdersStats.tsx:10-12` filters `orders` (the current page). If the page is filtered to PAID only, "Verificación" and "Canceladas" show 0. Total uses `totalItems` (global) so the dashboard is internally inconsistent. Severity MEDIUM. There IS a `GET /orders/stats` endpoint registered but it routes to `getProductStats` (`backend/src/routes/orders.ts:12`) — wrong handler, not even an order stats handler exists.
- **`alert()` + `window.confirm()`**: `order.tsx:88, 99` — inconsistent with `ConfirmModal` + `toast` used everywhere else in admin. Severity LOW.
- **No filter UI for `paymentMethod`** even though the loader reads it from the URL and the backend supports it (`order.tsx:44-45`, `backend/src/schemas/order.ts:23-29`). Severity LOW.
- **No date-range filter** (admin cannot scope to "today" or "this week").
- **No search by order ID, customer email, or amount range.**
- **No customer info in the list or modal**: an admin cannot see who placed the order without manually querying the DB. The model joins userId but the modal renders the masked ID (`OrderDetailModal.tsx:98`). Severity HIGH for store ops.
- **No shipping address / fulfillment status**: orders only have `status`, `totalAmount`, `paymentMethod`, `receiptUrl`. There's no shipped/delivered state.
- **No refund**: there is no refund endpoint, no refund UI, no `REFUNDED` order status (`backend/src/models/order.ts:9`). Once `PAID`, the admin cannot reverse the order in any way through this UI.
- **CSRF on POST**: `csrfProtect` middleware is global (`backend/src/index.ts:86`); approve/reject use POST without CSRF token in `order.tsx:93-96`. The cookie-name and same-origin behaviour need to be verified. Possible failure mode if CSRF is enforced — but out of scope for this audit.
- **`any` types everywhere** in `order.tsx` (`useState<any>`, `(order: any) => ...`). No type safety. Severity LOW (code quality).

---

### 5. Users

**Does not exist.** There is no admin route for users. The only `/users` backend endpoints are `/me`, `/users/orders`, `/users/orders/:id` (`backend/src/routes/users.ts:11-13`) — all for the logged-in customer, none admin-scoped. An admin cannot list users, change roles, disable accounts, or reset a customer password from the panel.

---

## What Works

- Backend authorization model is consistent: `authenticate` + `requireAdmin` on every mutation and on order reads.
- Product CRUD is complete end-to-end with Cloudinary image upload and replacement, including duplicate-name protection and existing-category validation.
- Category CRUD is complete with safe-delete (refuses when products reference it).
- Order approve/reject covers the manual-transfer verification flow with proper stock restoration in a DB transaction.
- Streaming loaders with Suspense + Await give a good perceived perf on the dashboard and lists.
- Server-side filters compose (search + category + stock + sort) for products.

---

## Issues Found

### CRITICAL

None found at the data-loss level. The "missing frontend role check" is high-severity but defense-in-depth, not a data breach, because the backend still enforces `requireAdmin`.

### HIGH

1. **Frontend admin layout does not check role**.
   - File: `frontend/app/routes/admin/layout.tsx:18-44`.
   - Evidence: the loader calls `/auth/verify`, receives `{ user: { id, name, email, role } }` (`backend/src/controller/auth.ts:164-183`), but only checks `!data.user`. It never compares `role === "admin"`.
   - Effect: any authenticated customer can render the admin shell. Mutations fail server-side, but the UI leaks structure, navigation, and stat values where the loader doesn't 403 (dashboard renders zeros instead of redirecting).
   - Fix: `if (data.user.role !== "admin") throw redirect(ROUTES.HOME)`.

2. **`SalesValue` widget shows inventory value, not sales**.
   - File: `frontend/app/routes/admin/dashboard/page.tsx:52-54` passes `stats?.data?.totalValue` (which is `sum(price * stock)`) into `SalesValue` whose label is "Valor Total de Ventas". `backend/src/controller/dashboard.ts:67-72` confirms `totalValue` aggregates over `products`, not over orders.
   - Effect: business-critical KPI is wrong by orders of magnitude.

3. **No customer identification on orders**.
   - File: `frontend/app/common/components/admin/OrderDetailModal.tsx:96-98` and the orders list (`order.tsx:119-167`).
   - Evidence: the modal renders `order.userId.slice(0, 8)` and no email/name; the list has no customer column.
   - Effect: an admin reviewing a `PENDING_VERIFICATION` transfer has no way to identify the customer to confirm the deposit. Operationally blocking.

4. **No refund / no PAID reversal**.
   - Backend: no `refund` route (`backend/src/routes/orders.ts`), no `REFUNDED` enum value (`backend/src/models/order.ts:9`), no `OrderService` method.
   - Effect: once an order is PAID, the admin cannot undo it through the panel.

### MEDIUM

5. **OrdersStats counts the current page, not totals**.
   - File: `frontend/app/routes/admin/order/components/OrdersStats.tsx:10-12`.
   - Effect: switching pages changes the "Verificación / Pagadas / Canceladas" numbers.

6. **`GET /orders/stats` is wired to the wrong handler**.
   - File: `backend/src/routes/orders.ts:12` calls `getProductStats` (dashboard controller). There is no real order-stats handler.

7. **"Productos Recientes" is not sorted by date**.
   - File: `frontend/app/routes/admin/dashboard/page.tsx:30` requests `getProductsPaginated(1, 5)` without `sortBy`, so it uses the default `name` ASC (`backend/src/schemas/product.ts:151-159`).

8. **Page title regex never matches UUIDs**.
   - File: `frontend/app/common/components/admin/AdminLayout.tsx:27` matches `^/admin/products/\d+$`. Product IDs are UUIDs (`backend/src/controller/product.ts:92`). The edit page always falls through to the "Admin" default title.

9. **Sidebar shows hardcoded "Admin / Administrador"**.
   - File: `frontend/app/common/components/admin/sidebar/Sidebar.tsx:131-132`.
   - Effect: a layout that already receives `user` from the loader could show the real admin name/email; it doesn't.

### LOW

10. **Category edit uses client-side fetch instead of loader/action** — `frontend/app/routes/admin/category/category.$id.tsx:30-71`. Inconsistent with the rest of admin.

11. **Order approve/reject uses `window.confirm` + `alert`** — `order.tsx:88, 99`. Should use the existing `ConfirmModal` + `toast`.

12. **No `paymentMethod` filter UI** even though the loader reads `?paymentMethod=` — `order.tsx:44`.

13. **Type-safety regression in orders page** — pervasive `any` (`order.tsx:67-69, 119-167`).

14. **Sidebar "Pedidos" reuses the `Box` icon** of Productos — `Sidebar.tsx:31`. Minor visual confusion.

15. **Toast on product-create runs via `useEffect`** — `product.new.tsx:85-93`. Repeated submits can fire the navigate twice.

16. **Category delete error swallows server-provided count** — `categories.tsx:64`; backend returns "...tiene N productos asociados" (`controller/category.ts:188-194`) but the toast usually shows the generic message.

17. **Inventory `totalValue` returned as a number from `sum(...)`** — Drizzle returns NUMERIC as string in many drivers; `backend/src/controller/dashboard.ts:67-72` casts via `sql<number>` but no explicit `Number(...)` parse. Could render as `"123.45"` instead of `123.45`; the frontend does `value.toLocaleString` which would throw if it's a string. Worth verifying at runtime.

---

## Missing Features (what an admin needs to run a store but doesn't have)

- **User management**: list users, see customer email/name, change role, disable/enable accounts, force password reset.
- **Customer view on orders**: email, name, shipping address, phone.
- **Refunds & returns**: status, partial refunds, restocking decisions.
- **Shipping / fulfillment workflow**: status `SHIPPED`, `DELIVERED`, tracking number, courier.
- **Coupons / discounts / promotions**: none.
- **Inventory log / audit**: who changed stock and when.
- **Sales reports**: revenue by day/week/month, top products, conversion, AOV.
- **Date-range filters** on dashboard and orders.
- **Search by order ID / customer / amount** in the orders page.
- **Payment-method filter UI** in the orders page (backend ready).
- **CSV import/export** for products and orders.
- **Bulk actions**: bulk delete, bulk stock update, bulk price change, bulk category re-assign.
- **Multiple product images**, variants (size/color), SKU, weight, slug.
- **Active/inactive (draft/published) flag** for products.
- **Category ordering, slugs, icons, nesting**.
- **Tax / shipping settings**.
- **Store-level settings**: name, contact info, hours, banner, payment instructions.
- **Email templates** for order events.
- **Activity log / admin audit trail** (who approved/rejected which order).

---

## File References

### Frontend

- `frontend/app/routes/admin/layout.tsx` — admin shell + auth gate (missing role check)
- `frontend/app/routes/admin/dashboard/page.tsx` — dashboard loader + composition
- `frontend/app/routes/admin/dashboard/components/StatsGrid.tsx` — 4-card grid
- `frontend/app/routes/admin/dashboard/components/InventoryValue.tsx` — inventory $
- `frontend/app/routes/admin/dashboard/components/SalesValue.tsx` — MISLABELLED sales card
- `frontend/app/routes/admin/dashboard/components/RecentProducts.tsx` — list of 5
- `frontend/app/routes/admin/dashboard/components/QuickActions.tsx` — CTAs
- `frontend/app/routes/admin/product/products.tsx` — product list + filters + delete modal
- `frontend/app/routes/admin/product/product.new.tsx` — product create (loader+action)
- `frontend/app/routes/admin/product/product.$id.tsx` — product edit (loader+action)
- `frontend/app/routes/admin/category/categories.tsx` — category list
- `frontend/app/routes/admin/category/category.new.tsx` — category create
- `frontend/app/routes/admin/category/category.$id.tsx` — category edit (client-side, inconsistent)
- `frontend/app/routes/admin/order/order.tsx` — orders list + approve/reject
- `frontend/app/routes/admin/order/useOrdersFilters.ts` — URL-state filter hook
- `frontend/app/routes/admin/order/components/OrdersStats.tsx` — page-scoped stats (bug)
- `frontend/app/routes/admin/order/components/OrdersHeader.tsx` — pending-count badge + refresh
- `frontend/app/actions/product/product-delete.$id.tsx` — DELETE action handler
- `frontend/app/actions/category/category-delete.$id.tsx` — DELETE action handler
- `frontend/app/common/components/admin/AdminLayout.tsx` — sidebar+header wrapper (regex bug)
- `frontend/app/common/components/admin/AdminHeader.tsx` — top bar
- `frontend/app/common/components/admin/sidebar/Sidebar.tsx` — nav (hardcoded "Admin")
- `frontend/app/common/components/admin/OrderDetailModal.tsx` — order detail (no customer info)
- `frontend/app/common/components/admin/ProductForm.tsx` — RHF + Zod form
- `frontend/app/common/components/admin/CategoryForm.tsx` — RHF + Zod form
- `frontend/app/common/actions/auth-helpers.ts` — `requireAuth` (token-only)
- `frontend/app/common/constants/routes.ts` — admin URL constants
- `frontend/app/common/constants/order.constants.tsx` — status/payment configs
- `frontend/app/routes.ts:30-49` — admin route table

### Backend

- `backend/src/middleware/auth.ts:24-55` — `authenticate` + `requireAdmin`
- `backend/src/routes/dashboard.ts` — `/dashboard/stats` admin-gated
- `backend/src/controller/dashboard.ts` — stats aggregator (total, lowStock, withoutStock, totalCategory, totalValue)
- `backend/src/routes/products.ts:19-21` — admin-gated mutations
- `backend/src/controller/product.ts` — CRUD + image upload (createProduct line 81, updateProduct line 116, deleteProduct line 155)
- `backend/src/routes/categories.ts:18-20` — admin-gated mutations
- `backend/src/controller/category.ts` — CRUD + safe-delete (line 185)
- `backend/src/routes/orders.ts:12-17` — `/orders` + `/stats` + `/approve` + `/reject` admin-gated
- `backend/src/controller/order.ts:13-95` — admin order handlers (approve line 72, reject line 87)
- `backend/src/services/OrderService.ts:100-146` — `markOrderPaid`, `cancelOrder` (stock restoration)
- `backend/src/routes/users.ts` — NO admin endpoints
- `backend/src/models/order.ts:9` — status enum (no `REFUNDED`)
- `backend/src/schemas/order.ts:7-39` — query schema (paymentMethod filter exists but no UI)
- `backend/src/schemas/product.ts:155-178` — product query schema (sort defaults to name)
- `backend/src/services/imageUploadService.ts` — Cloudinary upload/replace/delete
- `backend/src/index.ts:86, 102-110` — middleware + route mounting
