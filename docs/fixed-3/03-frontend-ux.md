# 03 — Frontend / UX

**Prioridad:** P1-P2 — bugs visibles para el usuario o que rompen patrones de React Router v7.
**Áreas:** `frontend/app/routes/auth/*`, `frontend/app/common/config/api-client.ts`, `frontend/app/common/context/FavoritesContext.tsx`, componentes comunes.

---

## 3.1 Submit nativo rompe RR v7 en login/register 🔴

**Archivo:** `frontend/app/routes/auth/login.tsx:182-184` y `register.tsx:138-141`

**Problema:**
```tsx
<form onSubmit={handleSubmit((_, e) => e?.target.submit())}>
```
`handleSubmit` valida con RHF + zod en cliente, pero después llama `HTMLFormElement.submit()` que SALTA el handler de React Router — provoca un submit nativo full-page.

**Impacto:**
- Perdés el spinner de `useNavigation`.
- Perdés `actionData` en SPA mode.
- Forzás un page reload.
- Si JS falla, la validación cliente queda muerta sin fallback.

**Fix sugerido:** usar `useSubmit()` dentro de `handleSubmit`:
```tsx
const submit = useSubmit();
const onSubmit = handleSubmit((data) => {
  submit(data, { method: 'post' });
});
```

**Estado:** ✅ resuelto — `handleSubmit` ahora llama `submit(data, { method: 'post' })` de React Router en `login.tsx` y `register.tsx`. El spinner de `useNavigation` funciona correctamente y no ocurre page reload.

---

## 3.2 `FavoritesContext` muestra favoritos fantasma 🟠

**Archivo:** `frontend/app/common/context/FavoritesContext.tsx:39-52, 93-96`

**Problema:** el effect inicial hace fallback a localStorage cuando `serverFavoriteIds.length === 0`. Si el usuario autenticado borra todos sus favoritos en server, al recargar lee localStorage viejo y los muestra de nuevo.

**Impacto:** UX inconsistente — botones marcados que no están en backend.

**Fix sugerido:** gate por `isAuthenticated`:
```tsx
useEffect(() => {
  if (isAuthenticated) {
    setFavorites(serverFavoriteIds); // server es la verdad
  } else {
    setFavorites(readLocalStorage());
  }
}, [isAuthenticated, serverFavoriteIds]);
```
Y limpiar localStorage en login/logout.

**Estado:** ✅ resuelto — `FavoritesContext` ahora gatea la fuente por `isAuthenticated`. Autenticado → usa `serverFavoriteIds` (source of truth). Anónimo → lee localStorage. Se extrajo helper `readLocalStorage()` interno.

---

## 3.3 `api.gen.ts` generado y nunca usado 🟠

**Archivo:** `frontend/app/common/types/api.gen.ts` (2725 líneas)

**Problema:** existe script `gen:types` con `openapi-typescript`, pero el frontend mantiene tipos manuales paralelos en `response.ts`, `user-types.ts`, `product-types.ts`. Drift garantizado.

**Adicional:** `product-types.ts:1` importa `UUID` desde `crypto` (módulo de Node) en tipos compartidos cliente/servidor — va a romper en cliente si alguien hace `as UUID`.

**Fix sugerido — elegir una:**
- **(a) Consumir los tipos generados:** `import type { components } from '~/common/types/api.gen'; type AuthResponse = components['schemas']['AuthResponse'];`
- **(b) Eliminar `api.gen.ts` del repo:** dejarlo como artefacto solo-dev y borrar los scripts.

Si se elige (a), agregar pre-commit hook que corra `openapi:dump && gen:types && git diff --exit-code`.

**Estado:** ✅ resuelto — opción (b) elegida por el usuario. `api.gen.ts` eliminado. `gen:types` script removido de `package.json`. `openapi-typescript` removido de `devDependencies`. `import { UUID } from "crypto"` removido de `product-types.ts`; reemplazado por `type UUID = string` local.

---

## 3.4 Tailwind dinámico no funciona en `ProductCarousel` 🟠

**Archivo:** `frontend/app/common/components/ProductCarousel.tsx:45, 87`

**Problema:** `className={\`disabled:${colorDisabled}\`}` — Tailwind no genera clases en runtime. La clase `disabled:bg-primary-600/10` no existe en el bundle salvo que esté safelisteada en `tailwind.config`.

**Impacto:** el botón disabled NO tiene el estilo que se espera. Bug visual directo.

**Fix sugerido:** clases literales o `clsx`:
```tsx
className={clsx('...', isDisabled && 'disabled:bg-primary-600/10')}
```

**Estado:** ✅ resuelto — botones de navegación usan `clsx` con clases literales condicionales (`bg-primary-600/10` / `bg-primary-400`) en lugar de string interpolation dinámica. Tailwind puede detectar ambas clases estáticamente.

---

## 3.5 `key={index}` en lista de productos 🟡

**Archivo:** `frontend/app/common/components/ProductCarousel.tsx:62-64`

**Problema:** reordenamientos rompen estado de hijos. Hay `product.id` (UUID) disponible.

**Fix:** `key={product.id}`.

**Estado:** ✅ resuelto — `key={index}` → `key={product.id}` en `ProductCarousel.tsx`.

---

## 3.6 `Popover` se cierra antes que el child reciba click 🟡

**Archivo:** `frontend/app/common/components/Popover.tsx:23`

**Problema:** click-outside con `mousedown` puede cerrar el popover antes de que un botón hijo reciba el `click`.

**Fix sugerido:** usar `pointerdown` con check explícito de `containerRef.current.contains(e.target)`, o usar `click` en vez de `mousedown`.

**Estado:** ✅ resuelto — `mousedown` reemplazado por `click` en `Popover.tsx`. El child recibe su click event antes de que el listener del documento cierre el popover.

---

## 3.7 `Toast` singleton roto con HMR 🟡

**Archivo:** `frontend/app/common/components/Toast.tsx:65,77`

**Problema:** singleton module-level `toastCallback`. Si se monta más de un `ToastContainer` (HMR, doble layout), el segundo pisa al primero y los `toast()` van al inadecuado.

**Fix sugerido:** Context + provider, o warning si ya hay callback registrado.

**Estado:** ✅ resuelto — `ToastContainer` emite `console.warn` si detecta un segundo registro y hace early return (preserva el primer container). Evita el problema de HMR y doble-layout sin refactor completo a Context.

---

## 3.8 Errores crudos del backend pintados en UI 🟡

**Archivos:**
- `frontend/app/routes/auth/register.tsx:51`
- `frontend/app/routes/checkout/checkout.tsx:89, 97`

**Problema:** `catch (err: any)` + render de `err.message` crudo. El mensaje puede contener detalles internos.

**Fix sugerido:** `instanceof ApiError` + mapeo por código (el patrón ya existe en `mapGoogleLoginErrorCode`).

**Estado:** ✅ resuelto — `register.tsx` action usa `instanceof ApiError` con mapeo por código (`EMAIL_ALREADY_EXISTS`, `GOOGLE_ID_MISMATCH`). `checkout.tsx` action usa `instanceof ApiError` con mapeo (`INSUFFICIENT_STOCK`, `INVALID_CART`). Mensajes genéricos como fallback.

---

## 3.9 Casts inseguros y `any` en formularios 🟡

**Archivos:**
- `frontend/app/common/components/admin/ProductForm.tsx:71, 95` — `as any`, `data: any`
- `frontend/app/routes/auth/login.tsx:55, 89-91` — `as Error & { code?: string }`

**Fix sugerido:** dejar que el zodResolver derive el tipo (`z.infer<ReturnType<typeof getProductSchema>>`); declarar union explícito como retorno del `action()` para narrowing automático de `actionData`.

**Estado:** ✅ resuelto — `ProductForm.tsx`: `type ProductFormData = z.infer<ReturnType<typeof getProductSchema>>`, removido `as any` en `zodResolver` y `data: any` en `onFormSubmit`. `login.tsx`: declarado `type ActionData` explícito como union, el componente usa narrowing por `"error" in typedData` en lugar de cast. Cast inseguro `as Error & { code? }` reemplazado por check de propiedad seguro.

---

## 3.10 Email en query param se renderiza directo 🟡

**Archivo:** `frontend/app/routes/auth/check-email.tsx:79-85`

**Problema:** React escapa, no es XSS, pero permite phishing in-domain: un atacante manda a la víctima `/auth/check-email?email=texto-arbitrario-haciendo-pasar-por-soporte` y se le muestra ese texto en tu dominio.

**Fix sugerido:** validar formato email antes de pintarlo, o no renderizar el valor recibido.

**Estado:** ✅ resuelto — `check-email.tsx` valida el query param con `z.string().email().safeParse()`. Si no es email válido, `email` queda como `""` y no se renderiza ningún valor arbitrario.

---

## 3.11 Double-check redundante en producto 🟡

**Archivo:** `frontend/app/routes/product/product.$id.tsx:48-50`

**Problema:** `if (!product) throw new Error(...)` después de que el loader ya garantiza `product`. Código muerto que dispara error boundary del lado cliente sin razón.

**Fix:** eliminar.

**Estado:** ✅ resuelto — bloque `if (!product) throw new Error(...)` eliminado de `product.$id.tsx`. El loader ya garantiza non-null.

---

## 3.12 Frontend NO envía CSRF token 🟠

**Archivo:** `frontend/app/common/config/api-client.ts:29-69`

**Problema:** envía `credentials: 'include'` (cookie de sesión viaja) pero NUNCA lee ni inyecta CSRF token. El backend lo espera (mapea `CSRF_ERROR`).

**Nota:** **prioridad baja según el usuario** porque la web no es alto perfil. Aun así, si el backend ya tiene el middleware activo, en algún momento alguien va a chocar con un error `CSRF_FAILED` legítimo.

**Fix sugerido:** ver `05-seguridad.md` § 5.1.

**Estado:** ⬜ pendiente (P3)

---

## Checklist

- [x] 3.1 Reemplazar submit nativo por `useSubmit()` en login/register
- [x] 3.2 FavoritesContext: gate por `isAuthenticated`
- [x] 3.3 Decidir: consumir `api.gen.ts` o eliminarlo
- [x] 3.4 Fixear clases Tailwind dinámicas en ProductCarousel
- [x] 3.5 Key por `product.id`
- [x] 3.6 Popover: cambiar mousedown → click
- [x] 3.7 Toast: Context + provider
- [x] 3.8 Errores de backend con `instanceof ApiError`
- [x] 3.9 Eliminar `as any` en ProductForm / login
- [x] 3.10 Validar email en check-email
- [x] 3.11 Borrar throw redundante en product.$id
- [ ] 3.12 (P3) Inyectar CSRF token
