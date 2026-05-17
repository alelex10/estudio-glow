# Checkout & Payments Audit — User Perspective

> **ESTADO ACTUAL (2026-05-17):** ✅ Backend: race conditions, idempotencia, webhooks, reconciliación MP, persistencia `payment_id` — todo resuelto. ❌ Frontend: MP sigue deshabilitado en UI, CBU placeholder, sin `back_urls`, sin página de confirmación, sin direcciones, sin cálculo de envío/impuestos.

Audit scope: end-to-end checkout and payment experience for a customer of Estudio Glow.
Date: 2026-05-15
Method: static analysis only (no runtime).

---

## Overview

The application offers a single-page checkout (`/checkout`) with **two declared payment methods**: MercadoPago and bank transfer. In practice MercadoPago is **hard-disabled on the UI** (`disabled` radio, label "No disponible por el momento"), so the only real path a user can complete is **TRANSFER with manual receipt upload**.

The backend has a complete MercadoPago integration (preference creation, HMAC-signed webhook, idempotent payment processing, order expiration cron), but the customer-facing surface area is decoupled from it — there is no UI to actually use MP, no success/failure return pages, no shipping address capture, no shipping cost, no tax, and no order confirmation page. After paying, the user is bounced to the home page with a toast.

Stack: React Router v7 + Express (Bun) + Drizzle ORM + MercadoPago SDK.

---

## User Journey (Checkout Flow)

### 1. Entering checkout

- Route definition: `frontend/app/routes.ts:22` → `routes/checkout/checkout.tsx`.
- `loader` (`checkout.tsx:22-28`) requires an auth token. Unauthenticated users are redirected to `/login?redirect=/checkout`. **No guest checkout.**
- If the cart is empty (`checkout.tsx:146-152`) the user sees `EmptyCartState` with a "Explorar catálogo" CTA.

### 2. What the user sees on `/checkout`

A 3-column layout (`checkout.tsx:154-283`):

- **Order summary card** with read-only `CartItemsList` (`checkout.tsx:163-169`, `cart/CartItemsList.tsx`).
- **Payment method card** (`checkout.tsx:172-272`) with two radios:
  - **Mercado Pago** — `disabled` attribute hard-set (`checkout.tsx:195`), styled `opacity-60 cursor-not-allowed`, labelled "No disponible por el momento" (`checkout.tsx:201`). Cannot be selected.
  - **Transferencia Bancaria** — default selection.
- When TRANSFER is selected (`checkout.tsx:228-260`) a panel reveals:
  - Hard-coded bank data: `Alias: ESTUDIO.GLOW` and `CBU: 0000000000000000000000` (`checkout.tsx:235-236`). The CBU is **a placeholder** (22 zeros).
  - File input for "Cargar Comprobante" (image only, `accept="image/*"`).
- **Sidebar** `OrderSummarySidebar` (`cart/OrderSummarySidebar.tsx`):
  - "Envío: Gratis" (line 23).
  - "Impuestos: Calculado al checkout" (line 27) — but **nothing is ever calculated**. Total = subtotal.
  - Total in pesos with `.toFixed(2)`.
- The submit button is disabled until a receipt file is chosen (`checkout.tsx:266`).

### 3. Submission

The form posts to the same route's `action` (`checkout.tsx:30-116`).

- A single `Idempotency-Key` UUID is generated client-side (`checkout.tsx:51`) and reused for both code paths.
- The action sends `cartItems` (productId + quantity only) as a hidden field (`checkout.tsx:173-177`). **Prices and product names come exclusively from the DB on the server side** — good, this is correct.

#### TRANSFER path

1. Frontend forwards `receipt` (File) + `items` via multipart `POST /checkout/transfer` (`checkout.tsx:96-104`).
2. Backend `routes/checkout.ts:38-54`:
   - `authenticate` → `idempotency` → `upload.single("receipt")` (5 MB cap, image MIME only — `middleware/file-validation.ts:36-45`).
   - Uploads to Cloudinary via `ImageUploadService.uploadImage(..., "receipts")`.
   - Calls `OrderService.createOrder(userId, "TRANSFER", items, receiptUrl)`.
   - Returns `{ orderId, status: "PENDING_VERIFICATION", receiptUrl }`.
3. `OrderService.createOrder` (`services/OrderService.ts:10-98`):
   - Validates non-empty items.
   - For each item: re-reads product from DB, validates stock, **decrements stock in the same transaction**, sums `price * quantity`.
   - Creates order with `status = "PENDING_VERIFICATION"`, `expiresAt = +48h`.
   - Inserts order items with `priceAtPurchase` snapshot.
4. On success the frontend shows toast "Orden creada exitosamente. Un administrador validará el pago." and `navigate(ROUTES.HOME)` (`checkout.tsx:138-140`). Cart is cleared.

#### MERCADO_PAGO path (currently unreachable from UI)

1. `POST /checkout/mercadopago` with `{ items }` and `Idempotency-Key` header (`checkout.tsx:71-74`).
2. Backend `routes/checkout.ts:19-36`:
   - `OrderService.createOrder(userId, "MERCADO_PAGO", items)` → status `PENDING`, `expiresAt = +15 min`.
   - `MercadoPagoService.createPreference(order.id, title, totalAmount)` returns `preference.init_point`.
   - Returns `{ orderId, preferenceUrl }`.
3. Frontend redirects the **entire window** to `preferenceUrl` (`checkout.tsx:136`) and clears cart.
4. After paying on MP, MP calls `notification_url` set in `MercadoPagoService.ts:11`, which defaults to `"https://your-ngrok.url/api/webhooks/mercadopago"` — a placeholder that obviously is not a real URL.
5. The webhook handler (`routes/webhooks.ts:15-41`):
   - HMAC-validated by `verifyMpWebhook` (`middleware/verify-mp-webhook.ts`).
   - De-duplicated via `WebhookEventService.recordOrSkip(paymentId, type)` using a unique constraint on `webhook_event.payment_id` (`models/webhook-event.ts:7`).
   - Fetches payment via MP SDK and, if `payment.status === "approved"`, calls `OrderService.markOrderPaid(payment.external_reference)`.
6. **The user never sees a return page** — `MercadoPagoService.createPreference` does NOT set `back_urls` or `auto_return` (`services/MercadoPagoService.ts:13-26`). After paying, MP returns the user to a generic MP screen, not back to the store.

### 4. Order lifecycle after checkout

- TRANSFER orders sit at `PENDING_VERIFICATION` (admin moderates).
- MP orders sit at `PENDING` with 15-minute `expiresAt`.
- `CronService.expireOrdersTick` (`services/CronService.ts:35-50`) runs every minute, finds expired non-terminal orders, calls `cancelOrder` (restores stock) and then overwrites status to `EXPIRED` (note: cancelOrder already sets `CANCELLED`, then the cron immediately re-sets to `EXPIRED` — see Issues).
- The user can view their orders at `/orders` but there is **no order detail page** linked from checkout, no "thank you" page, no order number shown after submission.

---

## What Works

| Capability | Evidence |
|---|---|
| Auth gating on checkout route | `checkout.tsx:22-28` (loader redirects to login) |
| Empty cart UX | `checkout.tsx:146-152`, `EmptyCartState.tsx` |
| Server-side price authority — prices read from DB, never from client | `OrderService.ts:24-46` |
| Stock validation & atomic decrement in transaction | `OrderService.ts:16-46` |
| Order items snapshot price at purchase | `OrderService.ts:85-93`, `models/order.ts:28` |
| Idempotency on `/checkout/*` against double-click | `middleware/idempotency.ts` + `routes/checkout.ts:19,38` |
| Receipt upload validation (5 MB, image MIME, allowlist) | `middleware/file-validation.ts:17-32, 36-45` |
| Receipt stored in Cloudinary, URL persisted on order | `routes/checkout.ts:50-51`, `models/order.ts:12` |
| MP webhook HMAC verification with fail-closed + clock-skew guard + constant-time compare | `middleware/verify-mp-webhook.ts:37-128` |
| MP webhook idempotency via unique DB constraint on `payment_id` | `services/WebhookEventService.ts:13-33`, `models/webhook-event.ts:7` |
| Raw-body parsing ordered before JSON for HMAC integrity | `routes/webhooks.ts:15-18` |
| Order expiration cron with Postgres advisory lock (multi-instance safe) | `services/CronService.ts:19-33, 52-65` |
| Stock restoration on cancel | `OrderService.cancelOrder` at `OrderService.ts:104-146` |
| Cart cleared after submit | `checkout.tsx:135, 138` |

---

## Issues Found

### CRITICAL

1. **MercadoPago is advertised in the UI but unusable.**
   - Evidence: `checkout.tsx:184-203` — radio is `disabled`, label says "No disponible por el momento".
   - User impact: only manual bank transfer with admin moderation is possible. Customers cannot pay online with a card. For an e-commerce in 2026 this is a showstopper.

2. **Placeholder bank account in production-quality code.**
   - Evidence: `checkout.tsx:235-236` — `CBU: 0000000000000000000000`. The Alias is hard-coded too.
   - User impact: real users would attempt a transfer to a non-existent CBU.

3. **MercadoPago `notification_url` defaults to a fake string.**
   - Evidence: `services/MercadoPagoService.ts:11` — `"https://your-ngrok.url/api/webhooks/mercadopago"`.
   - Impact: if `WEBHOOK_URL` env is missing, MP would try to call the placeholder. Should fail-closed (refuse to create preference) like the webhook validator does.

4. **No `back_urls` / `auto_return` on the MP preference.**
   - Evidence: `services/MercadoPagoService.ts:13-26` — only `items`, `external_reference`, `notification_url` are set.
   - User impact: after paying on MP, the user is NOT returned to the site. No success page, no failure page, no "your order is being processed". The webhook flips the DB but the user has no UI feedback.

5. **No order confirmation / success page.**
   - Evidence: TRANSFER returns to `ROUTES.HOME` with a toast (`checkout.tsx:138-140`). MP redirects out and never comes back (see #4).
   - User impact: no order number, no receipt, no "what happens next" copy, no way to revisit the freshly created order from the redirect.

6. **Order ID is never shown to the user.**
   - Evidence: backend returns `orderId` (`routes/checkout.ts:35, 53`); the frontend action discards it (`checkout.tsx:83, 112`).
   - Impact: a TRANSFER customer who closes the toast has no reference number for support.

### HIGH

7. **Inconsistent terminal state in the expiry cron.**
   - Evidence: `CronService.expireOrdersTick` (`services/CronService.ts:39-45`) calls `OrderService.cancelOrder(order.id)` (which sets `CANCELLED` and restores stock), then immediately overwrites status to `EXPIRED`. The audit trail is lost — what was supposed to look "expired" goes through a `CANCELLED` intermediate state. If anything reads the row between these two writes (separate statements, not in a single transaction) the value is `CANCELLED`.
   - Better: a dedicated `expireOrder` method that restores stock inside the same transaction and writes `EXPIRED` directly.

8. **Webhook handler uses `external_reference` as `orderId` without validation.**
   - Evidence: `routes/webhooks.ts:34-36` — `OrderService.markOrderPaid(payment.external_reference)`.
   - `markOrderPaid` (`OrderService.ts:100-102`) sets status to `PAID` regardless of current state. If a malicious actor crafts a payment with an `external_reference` matching some other user's `EXPIRED` or `CANCELLED` order, the row flips to PAID. There is no check that `(orderId, userId, amount)` match the payment.
   - Severity is mitigated by HMAC verification (only MP can submit), but still violates defense in depth.

9. **Idempotency store is in-memory and single-instance.**
   - Evidence: `middleware/idempotency.ts:7-12, 23` — `cache = new Map()`. Comments acknowledge the limitation ("For multi-instance deploys, replace with a shared store").
   - Impact: in any horizontally scaled deploy, a retry hitting a different instance bypasses idempotency and could create a duplicate order. Render free tier is single-instance, but this needs Redis/Postgres for any real scale.

10. **Idempotency middleware patches `res.json` and only caches `< 500`.**
    - Evidence: `middleware/idempotency.ts:78-87`. On a 5xx, the cache entry is deleted. On a 4xx (e.g. stock conflict), the failure is cached for 10 min — so a user who fixes their cart and retries with the same key in the same minute will keep receiving the cached failure response.
    - Frontend generates a fresh key per submit (`checkout.tsx:51`), so this is mostly mitigated client-side, but the contract is surprising.

11. **No CSRF protection on `/checkout/*`.**
    - Evidence: `routes/checkout.ts` uses `authenticate` + `idempotency`, no CSRF. `index.ts:86` mounts `csrfProtect` globally before `/checkout`, so it may actually be covered — needs verification of the `csrf.ts` implementation (out of scope here). The `X-Requested-With: XMLHttpRequest` header from the frontend (`checkout.tsx:58, 101`) is a common SOP escape hatch.

### MEDIUM

12. **`totalAmount` is `integer` (cents? whole pesos?).**
    - Evidence: `models/order.ts:10` — `integer("total_amount")`. Frontend uses `.toFixed(2)` everywhere (`OrderSummarySidebar.tsx:19`), suggesting it treats values as units, not cents.
    - If `products.price` is integer pesos, then `.toFixed(2)` always renders `.00`, and partial-peso pricing is impossible. If it's meant to be cents, the totals shown to the user are 100x too large. This needs a single source-of-truth decision.

13. **No `currency_id` on MP preference items.**
    - Evidence: `services/MercadoPagoService.ts:13-26`. MP defaults to the seller account currency, but for clarity and to avoid surprises in multi-country accounts, `currency_id: "ARS"` should be explicit.

14. **No quantity passed to MP — the entire order is one "item".**
    - Evidence: `routes/checkout.ts:29-33` — preference is created with a single line item `"Pedido Estudio Glow #..."` at `totalAmount` × 1. Quantity is hard-coded to 1 in `MercadoPagoService.ts:8`.
    - User impact: on the MP checkout screen the buyer sees one opaque line instead of their actual cart. Bad UX, harder to dispute, and bypasses MP's per-line discount features.

15. **`paymentMethod` from form is not validated.**
    - Evidence: `checkout.tsx:37` reads as `string`, then a string compare against `"MERCADO_PAGO"` (`checkout.tsx:70`). Anything else falls through to the TRANSFER branch even if the value is `"foo"`, as long as a receipt is attached. Server-side at `routes/checkout.ts` accepts whichever endpoint is hit, so this is mostly cosmetic, but the action is loose.

16. **Submit-while-redirecting race window.**
    - Evidence: `checkout.tsx:129-144` — on `preferenceUrl` the code calls `clearCart()` and then `window.location.href = preferenceUrl`. The cart is wiped client-side BEFORE the redirect. If MP creation succeeds but the redirect fails (network blip, popup blocker, slow nav), the user lands back on `/checkout` with an empty cart and no link to the order they just created.

17. **N+1 in `OrderService.createOrder`.**
    - Evidence: `OrderService.ts:24-46` (first pass) AND `OrderService.ts:75-94` (second pass) — products are re-fetched per item, twice. For a 10-item cart that's 20 selects. Could be a single `inArray()` lookup.

18. **No file-type magic byte check on receipt.**
    - Evidence: `middleware/file-validation.ts:11-32` — relies on `file.mimetype` from multer, which trusts the browser-provided header. A user could upload a `.exe` renamed `.png` with a forged MIME. Cloudinary will likely reject it on its side, but a `file-type`/magic-byte sniff would be safer.

19. **The "Impuestos" line is a lie.**
    - Evidence: `OrderSummarySidebar.tsx:25-28` — "Impuestos: Calculado al checkout". On the checkout page itself, nothing is calculated. Either remove the line or implement it.

20. **"Pago seguro y protegido" with a lock icon on the TRANSFER path.**
    - Evidence: `OrderSummarySidebar.tsx:46-51`. Misleading copy — transfers and receipt uploads aren't a secure payment gateway, they're a manual workflow.

### LOW

21. **`MercadoPagoService` uses `process.env` directly while the rest of the backend uses validated `env` from `config/env.ts`.**
    - Evidence: `services/MercadoPagoService.ts:5,11` vs `routes/webhooks.ts:8-10`.
    - Inconsistency; loses zod validation, silently falls back to `'APP_USR-testing_token'` if MP_ACCESS_TOKEN is missing.

22. **`receiptUrl` length capped at 255 chars.**
    - Evidence: `models/order.ts:12`. Cloudinary URLs are usually short enough, but transformations can balloon. `text` would be safer.

23. **Error handling in the action silently swallows JSON parse errors.**
    - Evidence: `checkout.tsx:77, 107` — `.catch(() => ({ error: { message: "Error al procesar el pago" } }))`. A 502 from the gateway shows the same generic message as a 400 validation error.

24. **`processedActionData` ref pattern.**
    - Evidence: `checkout.tsx:126, 129-144`. Works, but the use of `useRef` to dedupe an effect that depends on `actionData` is a code smell — the action could simply return a fresh object each time and the effect would re-run anyway. The current shape suggests an earlier bug they patched around.

25. **`metadata.title` static string for MP preference.**
    - Evidence: `routes/checkout.ts:31` — `` `Pedido Estudio Glow #${order.id.slice(0, 8)}` ``. Fine but leaks the order ID prefix; an opaque buyer-facing number would be cleaner.

---

## Missing Features

### Address & Shipping
- **No shipping address capture anywhere.** No `addresses` table (`backend/src/models/` has `cart, category, favorite, order, product, relations, user, webhook-event` — none holds an address). Frontend has zero address forms (grep for `address|shipping|envio|domicilio|provincia|ciudad` returns nothing in `frontend/app`).
- **No shipping cost calculation.** The sidebar hard-codes "Gratis" (`OrderSummarySidebar.tsx:23`).
- **No address book** for repeat customers.
- **No shipping carrier / tracking number** on orders.

### Tax
- **No tax computation.** Line says "Calculado al checkout" but nothing is ever calculated (`OrderSummarySidebar.tsx:27`).
- **No IVA/VAT breakdown** in the order, which is a likely legal requirement in Argentina.

### Payment methods
- **MP is disabled in UI** (see CRITICAL #1).
- **No card-on-file**, no MP wallet, no Brick (embedded MP form).
- **No "pay later" / installment selector.**
- **No QR / cash-payment options** (Pago Fácil, RapiPago).
- **No discount codes / coupons.**
- **No gift cards / store credit.**

### Checkout UX
- **No guest checkout** — login is required (`checkout.tsx:22-28`).
- **No "Save your details for next time" / address book.**
- **No order review step** — single screen, one click.
- **No success page** with order number, ETA, email confirmation copy.
- **No failure / cancel page** for MP returns.
- **No email confirmation** triggered after order creation (no `EmailService` import anywhere in `OrderService.ts`).
- **No "view my order" link** after submission.
- **No phone number capture** for delivery contact.

### Robustness
- **No persistent idempotency store** (Redis / DB) — only in-memory (`middleware/idempotency.ts:23`).
- **No retry / DLQ for failed webhook processing** — if `markOrderPaid` throws, MP gets a 500 (good, it'll retry), but there is no observability hook.
- **No metrics / alerting** on webhook failures, idempotency hits, or stuck orders.
- **No buyer information sent to MP preference** (`payer` field absent — would help MP fraud-score and auto-fill the buyer's data).
- **No `notification_url` whitelist or env validation** — `MercadoPagoService.ts:11` falls back to a string literal.

### Order management
- **No "cancel my order" button for the user** before payment expires.
- **No "upload new receipt"** if admin rejects the first one.
- **No re-payment flow** after expiry.

---

## File References

Frontend:
- `frontend/app/routes/checkout/checkout.tsx` — entire checkout page, loader, action.
- `frontend/app/routes.ts:22` — route registration.
- `frontend/app/common/components/cart/CartItemsList.tsx` — order summary line items.
- `frontend/app/common/components/cart/OrderSummarySidebar.tsx` — sidebar with sub-total/shipping/tax/total.
- `frontend/app/common/components/cart/EmptyCartState.tsx` — empty-cart fallback.
- `frontend/app/common/context/CartContext.tsx:136` — `clearCart` implementation called after submit.
- `frontend/app/common/config/api-end-points.ts:71-72` — checkout endpoints config.
- `frontend/app/common/constants/routes.ts:17` — `CHECKOUT` route constant.
- `frontend/app/common/constants/order.constants.tsx:33-34` — payment-method badge labels.

Backend — checkout & order:
- `backend/src/routes/checkout.ts` — `/checkout/mercadopago` and `/checkout/transfer`.
- `backend/src/services/OrderService.ts` — order creation, cancellation, queries.
- `backend/src/repositories/OrderRepository.ts` — DB layer.
- `backend/src/models/order.ts` — `orders` and `order_items` tables, status enum.

Backend — payments:
- `backend/src/services/MercadoPagoService.ts` — preference creation (incomplete: no back_urls, no payer, no quantity, no currency).
- `backend/src/routes/webhooks.ts` — `/api/webhooks/mercadopago` handler.
- `backend/src/middleware/verify-mp-webhook.ts` — HMAC verification (solid).
- `backend/src/services/WebhookEventService.ts` — per-payment dedup using unique constraint.
- `backend/src/models/webhook-event.ts` — `webhook_event` table.

Backend — supporting middleware/services:
- `backend/src/middleware/idempotency.ts` — in-memory idempotency cache (single-instance only).
- `backend/src/middleware/file-validation.ts` — multer config for receipt uploads.
- `backend/src/services/imageUploadService.ts` — Cloudinary upload.
- `backend/src/services/CronService.ts` — order expiry tick (has double-write bug, line 39-45).
- `backend/src/config/env.ts:20-37` — MP env validation.
- `backend/src/index.ts:109, 111` — router mounts.

---

## Summary

What an actual user experiences today:
1. They log in (forced, no guest path).
2. They are presented with a single payment option — bank transfer — because MP is greyed out.
3. The bank details shown are placeholder zeros.
4. They upload a receipt image, click "Confirmar y Pagar", see a green toast, and land on the home page.
5. They never see an order number, never receive an email, and have to navigate to `/orders` to confirm anything happened.

The backend wiring for a real payment flow (MP preference, signed webhook, idempotent processing, cron-driven expiry) is largely production-grade. The customer-facing surface is **stub-quality**: no MP UI, no return pages, no addresses, no shipping, no tax, no confirmation, no email. The gap between backend capability and frontend exposure is the dominant finding of this audit.
