# Product Browsing & Discovery — User-Perspective Audit

> **ESTADO ACTUAL (2026-05-17):** ❌ Sin cambios. Paginación del catálogo sigue rota, sin search global, sin productos relacionados, precios sin formato ARS.

> Static code review of what an end user can and cannot do today when browsing, searching and viewing products. The app was NOT executed; all findings are traced to file:line.

## Overview

The store is a Spanish-language beauty/skincare e-commerce ("Glow Studio") built with React Router v7 (frontend) and Express + Drizzle ORM (backend). Catalog is publicly browsable without login.

What a real user can do today:

- Land on `/` (home), see a hero and a carousel of the 8 most recently created products.
- Click "Productos" in the navbar to reach `/products` and see a **single, non-paginated** grid of products (default 10 per request, no Next/Prev controls).
- Open a filter sidebar (desktop) or drawer (mobile) to filter by category, stock state, and name (text search).
- Open a sort popover with 4 options (price asc/desc, name asc/desc).
- Click a product card to open `/product/:id` and see one image, description, stock badge, quantity selector, "Comprar ahora" and "Agregar al carrito".

What the user cannot do today: navigate beyond the first page of results, see prices with currency / thousands separators, see ratings or reviews, see related products on the detail page, see breadcrumbs, navigate to a category page directly, filter by price range, see a global header search, see an image gallery beyond a single image, see proper loading skeletons, see graceful "image broken" fallbacks. See [Missing Features](#missing-features) for the full list.

## User Journeys

### J1 — "I land on the homepage and want to see the catalog"

1. User visits `/` → route `frontend/app/routes/home/home.tsx:20` renders the `Home` page.
2. The loader (line 15) calls `productService.getNewProducts()` which hits `GET /products/news` (backend route `backend/src/routes/products.ts:18`).
3. Backend returns up to 8 products with `ProductRepository.findNewest(8)` (`backend/src/repositories/ProductRepository.ts:165-171`). No filters; returns plain product rows **without** the joined category.
4. The Hero (`frontend/app/routes/home/components/Hero.tsx:4-28`) displays a background image + tagline. There is NO CTA button anywhere on the hero.
5. Below an `<img src="/img/home/home-2.avif">` (decorative; `home.tsx:27` has empty `alt=""`).
6. A `ProductCarousel` (`frontend/app/common/components/ProductCarousel.tsx`) renders the newest products. Arrow buttons and dot navigation work, but there is NO link/button anywhere on the home page that takes the user to `/products`. The only path is the navbar.

### J2 — "I open `/products` to see the catalog"

1. Navbar link "Productos" (`frontend/app/common/constants/routes.ts: NAV_LINKS`) routes to `/products`.
2. The parent layout `frontend/app/routes/product/layout.tsx:15-22` fetches categories via `productService.getCategories()` (backend `GET /categories`, `backend/src/routes/categories.ts:16`). On failure it throws `data("Error loading categories", { status: 500 })` (line 20) — but no `ErrorBoundary` is exported in this file, so the user sees the **default React Router error UI**.
3. The child route `frontend/app/routes/product/products.tsx:12-36` reads query params (`page`, `limit`, `q`, `category`, `categoryId`, `stock`, `sortBy`, `sortOrder`) and calls `productService.getProductsPaginated(...)`.
4. Backend `listProductsPaginated` (`backend/src/controller/product.ts:23-55`) returns `{ data, pagination }` from `ProductRepository.findPaginated/countFiltered`.
5. Products are rendered in a 2-/3-column grid (`products.tsx:48-60`). Each card (`Card.tsx`) shows image, name (uppercased), price (`$X.XX`), favorite button, add-to-cart button.
6. **Pagination metadata is returned but never rendered.** `products.tsx` ignores `products.pagination` — there is no Next/Prev/page-number UI. The user is stuck on `page=1` unless they manually edit the URL.

### J3 — "I want to filter by category and search"

1. User clicks the "Filtros" button (mobile, `layout.tsx:53-60`) → opens `FilterDrawer`. Desktop shows `FilterSideBar` permanently (line 92-94).
2. Both components manage state via URL search params (`useSearchParams`). Selecting a category sets `?categoryId=…`, deselecting removes it. Stock is a radio with three options: `ok` (>10), `low` (1–10), `out` (0).
3. Search input: the user types a name and presses Enter or blurs the input → `applySearch()` writes `?q=…` to URL (`FilterSideBar.tsx:49-57`). This causes a loader revalidation which re-fetches products.
4. The "Limpiar todo" button removes all filters but preserves `sortBy`/`sortOrder` (`FilterSideBar.tsx:95-104`). Good touch.

### J4 — "I open the product detail page"

1. Clicking a card navigates to `/product/:id` via `<Link>` in `Card.tsx:33`.
2. `frontend/app/routes/product/product.$id.tsx:29-40` loader calls `productService.getProduct(id)` → backend `GET /products/:id` (`backend/src/controller/product.ts:58-73`). 404 throws `NotFoundError("Producto no encontrado")`. The frontend re-throws a generic `Error("No se encontro el producto")` (line 37) which produces a non-styled root error page (no `ErrorBoundary` in route).
3. The detail page shows: back arrow, favorite button, cart icon with count badge, one product image, name, price, decorative `Star` icon (always lit, no rating shown), description, category badge, stock badge (out/low/ok), quantity selector, "Comprar ahora", "Agregar al carrito".
4. Out-of-stock products only show a disabled "Sin stock" button.

## What Works

- **URL is the source of truth for filters/sort/search.** Filters survive refresh and are shareable. `useSearchParams` is used consistently in `FilterDrawer`, `FilterSideBar`, and product layout.
- **Filter UX is well thought out**: collapsible accordions, optimistic state for instant feedback on category selection (`FilterSideBar.tsx:59-65`), "Limpiar todo" preserves sort.
- **Backend filter combination is correct.** `ProductRepository.buildFilters` (`backend/src/repositories/ProductRepository.ts:88-132`) builds composable conditions for `q`, `categoryId`/`category`, and `stock`, with the "no-match" sentinel (line 109) preventing accidental full-table return when `category` doesn't resolve.
- **Cloudinary optimization** is applied uniformly: `getCloudinaryUrl(url, width)` adds `f_auto,q_auto,w_{width}` so cards request 400px and detail requests 800px (`utils.ts:23-39`, `Card.tsx:44`, `product.$id.tsx:119`).
- **Lazy-loading images.** Both card image (`Card.tsx:46`) and detail image (`product.$id.tsx:121`) use `loading="lazy"`.
- **Stock badge with three colors** (out=red, <5=yellow, else green) on detail page (`product.$id.tsx:159-170`) gives clear urgency cues.
- **Quantity selector** clamps to `[1, product.stock]` and disables buttons at limits (`product.$id.tsx:52-57, 182-194`).
- **Empty state for product list exists** ("No hay productos", `products.tsx:43-47`).
- **OOS card button is disabled** with proper `aria-label` (`Card.tsx:62-64`).
- **Public endpoint paths exist** both at `/products/*` (mounted publicly because product routes do not require auth except admin verbs) and `/public/products/paginated` & `/public/search` (`backend/src/routes/public.ts`).
- **Backend validates queries with Zod**: `PaginationProductQuerySchema` enforces `stock ∈ {low,out,ok}` and `sortBy ∈ {name,price,createdAt,stock}` (`backend/src/schemas/product.ts:154-181`).

## Issues Found

### CRITICAL

#### C1. There is no way to reach page 2 of the catalog
`frontend/app/routes/product/products.tsx:38-63` renders the grid but completely ignores `products.pagination` (which contains `page`, `totalPages`, `hasNextPage`, `hasPreviousPage`). The default `limit=10` (line 15) means a store with more than 10 products is effectively invisible past the first ten. A reusable `PaginationFooter` already exists at `frontend/app/common/components/data-table/PaginationFooter.tsx` (used in admin) — it is simply not wired into the public listing.

**Evidence:**
- `products.tsx:49` maps `products.data.map(...)` but never reads `products.pagination`.
- `productService.ts:13-23` even has an `emptyPagination` helper, confirming the pagination shape is known, yet unused on the page.

#### C2. Public/admin separation is illusory; ALL product mutating endpoints are mounted on the same router
`backend/src/routes/products.ts:19-21` declares `POST /`, `PUT /:id`, `DELETE /:id` with `authenticate, requireAdmin`. That is correct per-handler — but the same router also exposes public reads. Not a user-facing browsing bug, but worth flagging: the file `routes/public.ts` only re-exposes `listProductsPaginated` and `searchProducts` (`backend/src/routes/public.ts:8-9`); there is no `GET /public/products/:id` or `GET /public/products/news`. Anonymous users today rely on the unauthenticated routes in `routes/products.ts` working — which they do, but the "public" prefix is half-built and misleading.

### HIGH

#### H1. Home page has no link/CTA to the catalog
`frontend/app/routes/home/home.tsx:20-41`: hero has no button, and the carousel only links into individual products via the cards. A new user who doesn't notice the small "Productos" item in the navbar has no obvious way to browse the catalog.

#### H2. Prices are rendered as `${price.toFixed(2)}` but stored as integer ARS
- `Card.tsx:56`: `<p>${price.toFixed(2)}</p>` → renders `$1500.00`.
- `product.$id.tsx:143`: `<div>${product.price}</div>` → renders `$1500` (inconsistent with the card).
- Backend schema: `price: z.number().int().positive()` with description "Precio del producto en ARS (entero, sin decimales)" (`backend/src/schemas/product.ts:17-20`).

This is misleading UX — `$1500.00` reads like 1500 dollars with cents to most Spanish-speaking users. No thousands separator either: `$15000` is hard to parse vs `$15.000`. There is no `Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" })` formatter anywhere.

#### H3. No global / header search
The only search input lives inside the filter drawer/sidebar on `/products`. A user on the home page or product detail page cannot search without first navigating to `/products` and opening the filter. There is a reusable `SearchFilter` component (`frontend/app/common/components/search-filter/SearchFilter.tsx`) with debounce + loader spinner — also unused on the public site.

#### H4. Product detail page has no "Related products" / "Other products in this category"
`product.$id.tsx` ends after the action buttons. A user who decides not to buy this product has no path forward except the back arrow. The home `ProductCarousel` is not reused here.

#### H5. Product detail crashes the layout instead of rendering a friendly error
`product.$id.tsx:36-38`: if the loader doesn't get a product it `throw new Error("No se encontro el producto")`. There is no `ErrorBoundary` exported from this route file. The user sees React Router's default unhandled-error chrome. Same in `products` layout (`product/layout.tsx:20`) for category load failures.

#### H6. Pagination loader silently swallows 404 → user sees an empty list with no explanation
`productService.ts:52-55`: `if (err.message.includes("404")) return this.emptyPagination();` — but the empty pagination has `page: 0, limit: 0` (line 17-22), and `products.tsx` only checks `products?.data.length === 0`. The user gets "No hay productos" even when the real cause is a backend error. Also brittle: it depends on the error message containing the literal "404".

### MEDIUM

#### M1. Single product image only — no gallery, no zoom
`product.$id.tsx:118-123`: one `<img>` per product. Real beauty/skincare e-commerce expects a gallery (front/back/ingredients/swatch). The DB schema only stores one `imageUrl` (`backend/src/repositories/ProductRepository.ts:28`), so this is also a data-model gap.

#### M2. No image fallback on broken Cloudinary URL
Neither `Card.tsx` nor `product.$id.tsx` set `onError` on `<img>`. If Cloudinary serves a 404, the user gets the browser's "broken image" icon. There is no placeholder asset referenced anywhere.

#### M3. Loading state for the catalog is just text
- `home.tsx:33`: `<Suspense fallback={<div>Cargando productos...</div>}>`.
- `product/layout.tsx:89`: `<Suspense fallback={<div>Loading...</div>}>` (untranslated; the rest of the site is in Spanish).
- `products.tsx` has no Suspense at all → the page only renders after the loader resolves; on slow networks the user sees the previous page until the new one is ready.

There is a `LoadingState` component at `frontend/app/common/components/data-table/LoadingState.tsx` but it is admin-only.

#### M4. No price-range filter on the public listing
`SearchProductSchema` (`backend/src/schemas/product.ts:132-151`) supports `minPrice`/`maxPrice`, and `ProductRepository.search` (line 203-219) uses them — but `PaginationProductQuerySchema` (the one the catalog actually uses) does NOT include them. `FilterDrawer`/`FilterSideBar` have no price slider. So price filtering exists in the search endpoint but is invisible to the user.

#### M5. The `Star` icon on the detail page is a fake rating
`product.$id.tsx:146`: a single filled star with the span next to it commented out (line 147: `{/* <span ...></span> */}`). No reviews/ratings model exists. This is misleading — users assume the product has been rated.

#### M6. "Mis Ordenes" navbar link is shown to unauthenticated users
`frontend/app/common/constants/routes.ts: NAV_LINKS` always includes `ORDERS`, and `MobileDrawer.tsx`/`NavLinks.tsx` always render the whole list. Clicking it as a guest leads either to a login bounce or an empty page (depending on the orders route guard). It pollutes the browsing experience.

#### M7. Mobile drawer has a "Carrito" entry visually disabled with `opacity-50 cursor-not-allowed`
`frontend/app/common/components/nav-bar/MobileDrawer.tsx:101-116`: the cart link is given the disabled visual treatment with `title="Próximamente"`, yet it still navigates to `/cart`. This is half-built — either the cart works (it does — the route exists) or it doesn't. The user gets contradictory signals.

#### M8. "Productos" admin description leaks into the public title
- `products.tsx:8`: `description: "Panel de administración de Glow Studio"`.
- `product.$id.tsx:25`: same description.

The public catalog and detail pages advertise themselves to search engines / social previews as the admin panel. SEO regression.

#### M9. Filter sidebar is duplicated nearly verbatim with the drawer
`FilterSideBar.tsx` (238 lines) and `FilterDrawer.tsx` (234 lines) share the same logic with cosmetic differences. Any future change (e.g. adding price filter) requires editing both — high drift risk.

#### M10. Sort dropdown defaults inconsistent with backend
- `product/layout.tsx:29-30`: defaults are `sortBy = "name"`, `sortOrder = "asc"`.
- `backend/src/schemas/product.ts:156-162`: backend default is `sortBy = "createdAt"`.

If the user opens `/products` without picking a sort, the frontend visually highlights nothing (because no option's `sortBy === "name" && sortOrder === "asc"` matches any URL-resolved option for first paint) and the backend sorts by createdAt. Confusing.

### LOW

#### L1. Unused imports
- `product.$id.tsx:4`: `ChevronDown` imported, never used.
- `product/layout.tsx:3`: `ChevronDown` imported, never used.

#### L2. Decorative `<img>` with empty alt
`home.tsx:27`: `<img className="py-20" src="/img/home/home-2.avif" alt="" />` — fine for purely decorative, but inline `<section>` without an accessible heading on either side weakens the structure.

#### L3. Product carousel breakpoint hook recalculates on every render
`ProductCarousel.tsx:14`: `useBreakpoint()` returns the current breakpoint and the carousel resets to index 0 (line 25-27) whenever it changes. On a resize this jumps the user back to the start.

#### L4. `ProductCarousel` uses array index as React key
`ProductCarousel.tsx:64`: `key={index}`. If the products list ever changes order (e.g. live updates), React will reconcile incorrectly.

#### L5. `disabled:` Tailwind classes via template literals will not always work
`ProductCarousel.tsx:45,87`: `disabled:${colorDisabled}` is concatenated at runtime. Tailwind JIT cannot extract dynamic class names — this disabled style may silently fail.

#### L6. `Card.tsx` Link click conflicts with inner buttons
`Card.tsx:33` wraps the whole card in a `<Link>`. The Cart button uses `e.preventDefault()` (line 27) but `FavoriteButton` is rendered without a wrapping prevention in this file — clicking the favorite icon may also navigate to the product. (Would need to verify in `FavoriteButton`; flagging because the pattern is fragile.)

#### L7. Sort dropdown closes only on item click
`product/layout.tsx:41-47`: `handleSort` closes the popover, but no `onClickOutside` is shown in the snippet. (`Popover` may handle it; flagging because it is not visible at the call site.)

#### L8. Backend `search` endpoint returns at most 10 products, hard-coded
`ProductRepository.ts:210`: `db.select().from(products).limit(10)`. Not configurable. Acceptable for a typeahead, but the frontend currently does not call this endpoint anywhere (`searchProducts` is defined in `productService.ts:117-130` but unused).

## Missing Features

A real e-commerce user would reasonably expect, and the codebase does not currently provide:

1. **Pagination UI on `/products`** (next/prev page, page number selector). The data is returned; the UI is missing.
2. **A header search bar** available from every page (the `SearchFilter` component already exists, unused).
3. **Price-range filter** on the catalog (`minPrice`/`maxPrice` exist in the search schema but not the pagination schema).
4. **Sort by "Newest"** in the public sort options (the backend supports `sortBy=createdAt`; the frontend lists only price and name).
5. **Currency-aware price formatting** (`Intl.NumberFormat`, e.g. `$15.000`), used consistently across card, carousel, detail.
6. **Product image gallery + zoom** on the detail page (data model also stores only one URL — schema change needed).
7. **Related / recommended products** on the detail page (could reuse `ProductCarousel` filtered by `categoryId`).
8. **Breadcrumbs** (`Home > Productos > Categoría > Producto`).
9. **Category landing pages** (`/categories/:slug` or `/products?categoryId=…` with a dedicated header / banner). The categories endpoint exists but no public route renders a category-specific page.
10. **Product reviews and ratings** (the decorative star icon implies they exist).
11. **"Recently viewed"** rail.
12. **SEO**: per-product `<title>` and `<meta description>`. Today every product detail page has `title="Glow | Productos"` and `description="Panel de administración…"` (`product.$id.tsx:24-26`). No structured data (`schema.org/Product`).
13. **Open Graph tags** for shareable product links (no `og:image`, `og:title`, `og:price:amount`).
14. **Filter chips / active filter summary** above the grid ("Categoría: Skincare ×", "Stock: Disponible ×"). Today the active state lives inside the filter panel only.
15. **Result count** on the listing ("Mostrando 1–10 de 47 productos"). The backend returns `totalItems`; the frontend does not display it.
16. **Skeleton loading** for cards (`LoadingState` exists for admin tables but no card skeleton).
17. **Image error placeholder** (`onError` fallback to a local SVG/Cloudinary placeholder).
18. **Empty state with action** — current "No hay productos" is a bare `<p>` with no "Clear filters" CTA (`products.tsx:43-47`).
19. **Out-of-stock notification signup** ("Avísame cuando vuelva").
20. **Wishlist sharing / count on cards** (favorites only show as an icon; no aggregate visibility).
21. **CTA in the hero section** ("Ver catálogo") and a "Featured categories" rail on home.
22. **Per-category filters / facets** (e.g. brand, size, ingredient) — only category and stock supported.
23. **Mobile sort + filter combined affordance** — today sort is always visible while filter is a separate button; small screens get cluttered.
24. **Product code / SKU** on the detail page.
25. **Currency / locale switcher** if international is in scope (probably out of scope for ARS-only).

## File References

Frontend — browsing surface:
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes.ts` — public routes wiring (lines 12-20).
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/layout.tsx` — top layout, sets up CartProvider / FavoritesProvider.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/home/home.tsx` — homepage, fetches new products.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/home/components/Hero.tsx` — hero, no CTA.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/product/layout.tsx` — product list parent with filter sidebar/drawer + sort popover.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/product/products.tsx` — product grid; ignores pagination metadata (CRITICAL).
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/product/product.$id.tsx` — product detail.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/Card.tsx` — product card.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/ProductCarousel.tsx` — homepage rail.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/product-filter/FilterSideBar.tsx` — desktop filter.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/product-filter/FilterDrawer.tsx` — mobile filter.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/search-filter/SearchFilter.tsx` — reusable, currently UNUSED on public pages.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/data-table/PaginationFooter.tsx` — reusable pagination, admin only.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/nav-bar/Navbar.tsx` — header.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/nav-bar/NavLinks.tsx`, `MobileDrawer.tsx` — navigation links.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/constants/routes.ts` — `NAV_LINKS` and `ROUTES`.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/services/productService.ts` — calls backend endpoints (line 53 swallows 404).
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/lib/utils.ts` — `getCloudinaryUrl`.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/config/api-end-points.ts` — endpoint map.

Backend — browsing API:
- `/home/alelex10/Escritorio/estudio-glow/backend/src/routes/products.ts` — `GET /products/:id`, `/paginated`, `/search`, `/news`.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/routes/categories.ts` — `GET /categories`, `/categories/:id`.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/routes/public.ts` — duplicates `/paginated` and `/search` under `/public`; incomplete.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/controller/product.ts` — handlers; `listProductsPaginated`, `getProduct`, `getNewProducts`, `searchProducts`.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/controller/category.ts` — `listCategories` (supports `q`, sorted by name).
- `/home/alelex10/Escritorio/estudio-glow/backend/src/repositories/ProductRepository.ts` — Drizzle queries; filter builder lines 88-132, `findPaginated` lines 185-200, `search` lines 203-219 (hardcoded `limit(10)`).
- `/home/alelex10/Escritorio/estudio-glow/backend/src/schemas/product.ts` — Zod schemas; `PaginationProductQuerySchema` lacks `minPrice`/`maxPrice` (line 154-181).
- `/home/alelex10/Escritorio/estudio-glow/backend/src/types/pagination.ts` — metadata shape (already returned, not rendered).
- `/home/alelex10/Escritorio/estudio-glow/backend/src/models/category.ts` — category model.
