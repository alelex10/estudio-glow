# Issues resueltos de Arquitectura Frontend

> Espejo de [`06-arquitectura-frontend.md`](../improvements/06-arquitectura-frontend.md) — issues resueltos.

---

### ✅ [CRÍTICO] JWT token leak eliminado de SSR loaders

**Issue original**: Issue #3 — 5 SSR loaders devolvían `{ token }` en el payload serializado al HTML, anulando la protección `httpOnly` de la cookie.

**Solución**: Eliminado `token` de los 5 loaders y de las llamadas a `apiClient`. El token era redundante: `apiClient` ya envía `credentials: include` y el backend lee la cookie `httpOnly` primero.

**Archivos**:
- `frontend/app/routes/checkout/checkout.tsx`
- `frontend/app/routes/admin/order/order.tsx`
- `frontend/app/routes/orders/orders.tsx`
- `frontend/app/routes/admin/product/product.new.tsx`
- `frontend/app/routes/admin/category/category.new.tsx`

---

### ✅ [ALTO] Doble-submit en checkout con guard ref

**Issue original**: Issue #5 (05-diseno-api.md) — el POST a `/checkout/mercadopago` y `/checkout/transfer` podía ejecutarse múltiples veces si el usuario hacía doble click o si el frontend reintentaba por network timeout, creando órdenes duplicadas.

**Solución**: Agregado guard con `useRef` + `useState` loading. El ref previene que el handler se ejecute dos veces en el mismo event loop tick (algo que `useState` no puede garantizar). El botón se deshabilita durante el procesamiento.

**Archivos**: `frontend/app/routes/checkout/checkout.tsx`.
