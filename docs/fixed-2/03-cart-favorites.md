# Audit: Cart & Favorites (User Perspective)

Static review of code only. The application was not run. All file references are absolute paths with line numbers.

---

## Overview

The store has two related but very differently-implemented systems:

- **Cart** lives entirely in the browser. `localStorage` under key `glow_cart` is the only source of truth. The frontend never calls the backend cart endpoints. Backend cart code exists (`/cart`, `/cart/sync`, `DELETE /cart/:productId`) but is dead code from the client's perspective.
- **Favorites** is server-backed. The frontend calls `/favorites` for the list, `/favorites/ids` to seed the layout loader, and `POST/DELETE /favorites/:productId` to toggle. A `glow_favorites` localStorage entry is kept as a "warm cache" only when the server seed is empty.

Both providers wrap the public store layout (`frontend/app/routes/layout.tsx:33-41`), so cart and favorites state are accessible from every public page.

### High-level architecture

| Concern | Cart | Favorites |
|---|---|---|
| Source of truth | `localStorage` (`glow_cart`) | Server (`favorites` table) |
| Provider | `CartContext` (`frontend/app/common/context/CartContext.tsx`) | `FavoritesContext` (`frontend/app/common/context/FavoritesContext.tsx`) |
| Guest support | Yes — fully usable without login | No — toggling requires login (`FavoritesContext.tsx:63-66`) |
| Cross-device sync | None | Yes (server-owned) |
| Backend route | `backend/src/routes/cart.ts` (unused by FE) | `backend/src/routes/favorites.ts` |
| Backend controller | `backend/src/controller/cart.ts` | `backend/src/controller/favorite.ts` |

---

## User Journeys

### Cart

#### Add to cart

- Entry points:
  - Product card (`frontend/app/common/components/Card.tsx:24-29, 59-64`) — single click adds `quantity: 1`, button disabled when `stock <= 0`.
  - Product detail page (`frontend/app/routes/product/product.$id.tsx:45-69, 213-223`) — user chooses a quantity (clamped to `[1, product.stock]` at `:52-57, :180-197`) and presses "Agregar al carrito" or "Comprar ahora" (`:71-75` navigates straight to checkout).
- `addToCart` (`CartContext.tsx:89-110`):
  - Refuses to add if `stock <= 0`.
  - If the product is already in the cart, increments quantity, capped at `item.stock`.
  - Persists via the change effect at `CartContext.tsx:83-87`.
- Feedback to the user: **none** — no toast, no drawer open, no visual confirmation. The only signal is the cart counter badge in the navbar (`CustomerLinks.tsx:21-28`, `AuthButtons.tsx:11-19`).

#### View cart

- Route: `/cart` (`frontend/app/routes/cart/cart.tsx`).
- Public route — no auth required (`routes.ts:21`, no loader/`requireAuth` in `cart.tsx`).
- Layout: list on the left (`CartItemsList`), summary on the right (`OrderSummarySidebar`).
- Each row shows image, name, unit price, current quantity, stock label, +/- buttons, remove button, and line subtotal (`CartItemsList.tsx:24-99`).
- Empty state CTA navigates to `/products` (`cart.tsx:30`, `EmptyCartState.tsx`).

#### Update quantity / remove

- `updateQuantity` (`CartContext.tsx:116-134`): if `quantity <= 0` removes the item; if `quantity > stock` it **silently returns the previous state** (no toast, no error).
- The `+` button in `CartItemsList.tsx:68-75` is disabled when `quantity >= stock`, so the silent-fail path is mostly avoided.
- `removeFromCart` (`CartContext.tsx:112-114`) — instant, no confirmation dialog.

#### Stock refresh / hydration

- On mount (`CartContext.tsx:43-80`): for every cart item, fetch the product from the API and overwrite the stored `stock` field. If the API call fails it falls back to the stored stock or `999`.
- A separate `refreshStock()` is exported (`CartContext.tsx:138-161`) but it is never called anywhere — only the initial mount uses fresh stock.
- There is no validation step before checkout submission beyond what `CartService.syncCart` does server-side when an order is created (`backend/src/services/CartService.ts:31-63` — but this isn't called by the current checkout flow either; see "Checkout" below).

#### Totals

- `totalItems` and `totalPrice` are computed in-memory (`CartContext.tsx:163-167`). They include neither taxes nor shipping. The summary explicitly labels shipping "Gratis" and taxes "Calculado al checkout" (`OrderSummarySidebar.tsx:21-28`), but the totals shown elsewhere never change.

#### Checkout

- Cart contents are passed to the action as a hidden field (`checkout.tsx:174-177`) — `productId` + `quantity` only.
- The action POSTs directly to `/checkout/mercadopago` or `/checkout/transfer` (`checkout.tsx:71-104`). It does **not** call `/cart/sync` first, and the Mercado Pago option is hard-disabled in the UI (`checkout.tsx:184-203`, `disabled` radio, opacity-60).
- On success the cart is cleared client-side (`checkout.tsx:135, 138`).

#### Persistence across sessions

- **Guest user**: cart survives reloads, survives closing the browser — `localStorage` is durable.
- **Logged-in user**: same. Login does NOT pull a server cart; logout does NOT push the local cart anywhere. No sync between devices. The backend `/cart` endpoints exist but are orphaned.

---

### Favorites

#### Add / remove a favorite

- Entry point: `FavoriteButton` (`frontend/app/common/components/button/FavoriteButton.tsx`), rendered from product cards (`Card.tsx:58`), product detail (`product.$id.tsx:93-97`), and inside the favorites grid (`favorites.tsx:81-85`).
- `toggleFavorite` (`FavoritesContext.tsx:61-106`):
  1. If `!isAuthenticated`, shows toast `"Iniciá sesión para guardar favoritos"` and returns (`:63-66`).
  2. Optimistic update — toggles the local `Set<string>` immediately (`:70-80`).
  3. Calls `POST /favorites/:productId` or `DELETE /favorites/:productId`.
  4. On success: toast `"Agregado a favoritos"` / `"Eliminado de favoritos"`, then writes the new `Set` to `localStorage["glow_favorites"]`.
  5. On error: reverts to the previous `Set`, toast `"Error al actualizar favoritos"`.

#### View favorites

- Route: `/favorites` (`frontend/app/routes/favorites/favorites.tsx`).
- Loader requires auth (`favorites.tsx:23-31`, `requireAuth(request)`). If `favoriteService.list` throws, the loader returns `[]` (silent — no error UI).
- Grid renders product cards with image, name, price, and a `FavoriteButton` overlay (`favorites.tsx:67-114`). Clicking the heart on a favorite removes it; clicking the card navigates to the product page.
- Empty state: heart icon, copy `"No tenés favoritos todavía"`, CTA to `/products` (`:115-140`).

#### Cross-device sync

- Layout loader (`layout.tsx:16-29`) reads `GET /favorites/ids` server-side and seeds the provider via `serverFavoriteIds`.
- The provider only consults `localStorage` if `serverFavoriteIds.length === 0` (`FavoritesContext.tsx:39-52`).
- Effect: log in on any device → see your favorites. Multi-device works.

#### Guest behavior

- `FavoriteButton` still renders on cards for guests, but tapping it shows an info toast and does nothing — no redirect to login, no "save for later" promise.

---

## What Works

- Cart end-to-end for the happy path (add → view → adjust → checkout via transfer).
- Cart counter badges in both desktop and mobile navbars react to context state (`CustomerLinks.tsx:21-28`, `AuthButtons.tsx:11-19`).
- Stock is re-fetched on mount so a stale cart can't allow ordering more than current stock (modulo race conditions between mount and checkout).
- `addToCart` correctly caps quantity at stock and refuses to add out-of-stock items (`CartContext.tsx:89-110`).
- `updateQuantity(0)` correctly removes the item.
- Favorites optimistic toggle with rollback on failure (`FavoritesContext.tsx:70-103`).
- Server-side seeding of favorites via the layout loader gives instant cross-device parity after login (`layout.tsx:16-29`).
- Favorites toasts give clear feedback for every state (`FavoritesContext.tsx:64, 86, 89, 100`).
- Favorites backend correctly returns 409 on duplicate add and 404 on missing remove (`controller/favorite.ts:35-37, 62-64`).
- Drawer (`Drawer.tsx`) has Escape-to-close, focus trap, focus restore, and body-scroll lock — solid accessibility.

---

## Issues Found

### CRITICAL

1. **Cart backend is dead code; logged-in users have no cross-device cart.**
   `backend/src/routes/cart.ts:1-13` exposes `GET /cart`, `POST /cart/sync`, `DELETE /cart/:productId`. None of these are called from the frontend (grep of `frontend/app` for `API_ENDPOINTS.CART` returns only the endpoint definitions in `api-end-points.ts:64-68`). Logging in on a second device shows an empty cart even if the first device has items. This contradicts what a logged-in user reasonably expects from an e-commerce app.

2. **Mobile users CANNOT navigate to the cart from the menu.**
   `frontend/app/common/components/nav-bar/MobileDrawer.tsx:101-116` renders the cart link with `opacity-50 cursor-not-allowed` and `title="Próximamente"`. The link still has `to={ROUTES.CART}` so it technically works if a user manages to tap it, but visually it's disabled. Mobile users can still reach the cart by other means (back from product detail, deep link), but the primary nav advertises the feature as "coming soon" while the rest of the app uses it freely.

### HIGH

3. **No feedback when adding to cart.**
   `Card.tsx:26-29` and `product.$id.tsx:59-69` call `addToCart` and return. No toast, no badge animation, no drawer open. The only change is a small number in the navbar that's easy to miss on desktop and invisible on mobile until the menu opens. Users will tap the button twice thinking nothing happened.

4. **`updateQuantity` fails silently when exceeding stock.**
   `CartContext.tsx:126-128` returns `prev` unchanged when `quantity > stock`. No toast, no input rejection visible to the user. The `+` button is disabled at the boundary (`CartItemsList.tsx:70`), so this path is only reachable through programmatic input, but if a `<input type="number">` is ever wired in this becomes a silent bug.

5. **`refreshStock` is exported but never invoked.**
   `CartContext.tsx:138-161` defines a `useCallback` that the rest of the app never consumes (grep confirms zero usages). Stock can become stale during a long session — a user adds 3 items, leaves the tab open for 2 hours, another customer buys everything, our user is allowed to "Confirmar y Pagar" with no warning. The function is half-built: written, exported, forgotten.

6. **No reconciliation when guest user logs in.**
   A guest fills their cart, decides to register/login, and... their cart remains because both states use the same `localStorage` key. That looks like it works, but if the user was already logged in on another device with a different cart, neither cart is merged. There is no "merge local cart with server cart" anywhere.

7. **Favorites in `Card.tsx:58` get a guest-toast on every tap with no path forward.**
   The button doesn't redirect to login, doesn't queue the favorite for after-login, doesn't even disable. Each tap shows the same toast. UX dead-end.

### MEDIUM

8. **Backend lacks `PATCH /cart/:productId` for quantity changes.**
   `routes/cart.ts:9-11` only exposes get / full-sync / remove-one. There's no incremental update. Even if the frontend wanted to use the server cart, every quantity bump would require a full `POST /cart/sync` (replace-all semantics — see `CartService.ts:47-61`). That's not wrong, but it's wasteful and unusual.

9. **`CartService.syncCart` deletes all items and reinserts inside a non-transactional loop.**
   `backend/src/services/CartService.ts:47-61` performs `DELETE FROM cart_items WHERE cart_id = ?` and then a `for` loop of `INSERT` per item, with no `db.transaction`. If the request fails halfway, the user's server cart is left empty or partially populated.

10. **Favorites add can race when the optimistic state and server disagree.**
    `FavoritesContext.tsx:68` returns early when `isLoading`, but multiple rapid taps on different products will share `isLoading=true` and silently drop subsequent toggles. Only one favorite can be toggled at a time across the whole UI.

11. **Loader swallows errors silently.**
    `favorites.tsx:25-30` returns `[]` on any error. A 500 from the server looks identical to "no favorites" — same empty state, same CTA. Same problem in `layout.tsx:21-26` for the navbar count.

12. **No "save for later" / "move to favorites" cross-action.**
    Cart items have no link to favorite them; favorites have no "add to cart" button (`favorites.tsx:67-113` only links to the product detail). Standard e-commerce affordance is missing.

13. **`CartContext.tsx:67` falls back to `stock: 999` when stock is unknown.**
    On API failure during mount, the user can pump the `+` button up to 999 units, then checkout will reject the order. Better to disable the row or refuse increments while stock is unknown.

14. **Quantity total on `OrderSummarySidebar` says "Subtotal (X items)" using `totalItems`** (`OrderSummarySidebar.tsx:18`), which sums quantities, not distinct products. The cart page header at `cart.tsx:26` says "X productos" using the same `totalItems`, which is misleading when the user has 1 product with quantity 5 — it shows "5 productos". Pick one semantic.

### LOW

15. **`FavoriteButton` types `productId: UUID`** (`FavoriteButton.tsx:7`) but consumers pass `string` (`favorites.tsx:82`, `Card.tsx:58` with `UUID`, OK). TypeScript will narrow `UUID` to `string`, but the props are inconsistent — `productId` is `UUID` here, `UUID | string` in `CartItem` (`CartContext.tsx:12`).

16. **Stock label shows "Stock disponible: N" where N is total stock** (`CartItemsList.tsx:46-49`), not remaining-after-cart. The color flips orange when `stock - quantity <= 2` but the displayed number doesn't reflect that. Users will be confused that "Stock disponible: 5" turns orange when they have 3 in their cart.

17. **`useCart` and `useFavorites` providers don't expose any error state**, only `isLoading` (favorites). UI cannot show a banner if persistence breaks.

18. **`Drawer.tsx` panel is fixed at `w-80`** (`Drawer.tsx:86`). On small phones this is the right call; on tablets it looks cramped.

19. **No `aria-live` announcement** when the cart count changes — screen readers won't know an "add to cart" worked.

20. **Backend `addFavorite` throws 409 on duplicate** (`controller/favorite.ts:35-37`). The frontend's optimistic toggle assumes success or full failure; if a user already-favorited the product on another tab and then taps "add", the 409 triggers the generic error toast `"Error al actualizar favoritos"` (`FavoritesContext.tsx:100`), which is misleading — it's already favorited.

---

## Missing Features (User Expectations)

| Expected by users | Present? | Notes |
|---|---|---|
| See cart icon + count from any page | Yes (desktop), no (mobile primary nav) | `MobileDrawer.tsx:104` advertises it as "Próximamente" |
| Toast / animation when adding to cart | No | Silent add |
| Mini-cart dropdown / drawer on hover or tap | No | Only a link to `/cart` |
| Persist cart across devices when logged in | No | Local-storage only; backend exists but unused |
| Merge guest cart with server cart on login | No | No reconciliation logic anywhere |
| "Move to favorites" from cart | No | — |
| "Add to cart" from favorites grid | No | Only navigates to product page |
| Coupon / discount input | No | Summary has no input |
| Shipping cost calculation | No | Hard-coded "Gratis" (`OrderSummarySidebar.tsx:23`) |
| Tax line item | No | Hard-coded "Calculado al checkout" (`:27`) but never calculated |
| Save cart for later / wishlist multiple lists | Partial | Favorites is a single flat list |
| Sort / filter / search within favorites | No | `favorites.tsx` is an unfiltered grid |
| Bulk remove from favorites or cart | No | One-by-one |
| Confirmation dialog before remove | No | `removeFromCart` is instant |
| Empty-cart CTA that respects last category browsed | No | Always sends to `/products` |
| Out-of-stock warning when re-entering cart | Partial | Stock is refetched; if it dropped below qty, the cart silently displays the old qty with stock label going orange/red. No correction, no toast |
| Quantity input field (type a number) | No | Only +/- buttons |
| Stock dropped to 0 → automatic removal or warning | No | Item stays at requested qty, checkout will fail server-side |
| Recently-removed undo | No | — |
| Estimated delivery / pickup options | No | — |
| Login redirect when guest taps favorite | No | Only a toast |

---

## File References

### Frontend

- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/layout.tsx` (lines 16-43) — providers wiring, loader pulls `favoriteIds` from `/favorites/ids`.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/cart/cart.tsx` (lines 18-71) — cart page, no auth gate.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/favorites/favorites.tsx` (lines 23-146) — favorites page, `requireAuth` in loader.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/checkout/checkout.tsx` (lines 30-145, 174-177) — checkout posts items directly, never syncs cart server-side.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/routes/product/product.$id.tsx` (lines 45-75, 93-112, 180-223) — product detail wires both cart and favorites.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/context/CartContext.tsx` (full file, 193 lines) — localStorage-backed cart provider.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/context/FavoritesContext.tsx` (full file, 123 lines) — server-backed favorites with optimistic update.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/Card.tsx` (lines 24-72) — product card add-to-cart and favorite button.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/cart/CartItemsList.tsx` (lines 56-94) — quantity controls, remove button.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/cart/EmptyCartState.tsx` — empty state CTA.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/cart/OrderSummarySidebar.tsx` (lines 17-29) — totals, "Gratis" shipping placeholder.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/button/FavoriteButton.tsx` — heart button.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/nav-bar/CustomerLinks.tsx` (lines 13-29) — navbar badges, both work.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/nav-bar/AuthButtons.tsx` (lines 12-19) — guest navbar cart icon.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/nav-bar/MobileDrawer.tsx` (lines 101-116) — cart link disabled with "Próximamente".
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/Drawer.tsx` — accessible drawer used by mobile menu.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/components/Popover.tsx` — generic popover, not used by cart/favorites directly.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/services/favoriteService.ts` — favorites API client.
- `/home/alelex10/Escritorio/estudio-glow/frontend/app/common/config/api-end-points.ts` (lines 28-68) — endpoint constants (cart endpoints defined but unused).

### Backend

- `/home/alelex10/Escritorio/estudio-glow/backend/src/index.ts` (lines 10, 25, 106, 108) — routers mounted.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/routes/cart.ts` (full file, 13 lines) — all routes auth-gated, none reached from FE.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/controller/cart.ts` (full file, 36 lines) — `getCart`, `syncCart`, `removeCartItem` controllers.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/services/CartService.ts` (lines 31-63) — `syncCart` deletes-then-reinserts without a transaction; clamps quantity to stock.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/models/cart.ts` — `carts` + `cart_item` tables.
- `/home/alelex10/Escritorio/estudio-glow/backend/src/schemas/cart.ts` — `SyncCartSchema` (Zod).
- `/home/alelex10/Escritorio/estudio-glow/backend/src/routes/favorites.ts` (full file, 15 lines).
- `/home/alelex10/Escritorio/estudio-glow/backend/src/controller/favorite.ts` (full file, 104 lines) — list, ids, add (409 on dup), remove (404 on missing).
- `/home/alelex10/Escritorio/estudio-glow/backend/src/docs/cart.ts`, `backend/src/docs/favorites.ts` — OpenAPI docs.

---

## TL;DR for the next iteration

1. Pick a direction for the cart: either delete the backend (`routes/cart.ts`, `controller/cart.ts`, `services/CartService.ts`, `models/cart.ts`) and document "cart is intentionally local-only", or wire the frontend to use it and implement guest→user merge on login.
2. Either way, fix `MobileDrawer.tsx:101-116` — mobile users currently see "Próximamente" for a feature that works.
3. Add a toast / animation on add-to-cart. The current silent add is the single biggest UX gap.
4. Either invoke `refreshStock` periodically (on cart open, on checkout entry) or delete it from the public API.
5. Decide what "Stock disponible: N" means and align the number, the color threshold, and the cart-page header copy.
