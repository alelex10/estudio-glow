/** Strips leading / from a path, optionally removing an accumulated prefix. */
export function path(p: string, prefix?: string): string {
  let s = p.startsWith("/") ? p.slice(1) : p;
  if (prefix && s.startsWith(prefix + "/")) {
    s = s.slice(prefix.length + 1);
  } else if (prefix && s === prefix) {
    s = "";
  }
  return s;
}

export const ROUTES = {
  HOME: "/",
  PRODUCTS: "/products",
  PRODUCT: (id: string | number) => `/product/${String(id)}` as const,
  CART: "/cart",
  CHECKOUT: "/checkout",
  ORDERS: "/orders",
  FAVORITES: "/favorites",
  LOGIN: "/login",
  REGISTER: "/auth/register",

  admin: {
    BASE: "/admin",
    PRODUCTS: "/admin/products",
    PRODUCTS_NEW: "/admin/products/new",
    PRODUCT: (id: string | number) => `/admin/products/${String(id)}` as const,
    CATEGORIES: "/admin/categories",
    CATEGORIES_NEW: "/admin/categories/new",
    CATEGORY: (id: string | number) => `/admin/categories/${String(id)}` as const,
    ORDERS: "/admin/orders",
  } as const,

  actions: {
    AUTH_REGISTER: "/actions/auth/register-action",
    AUTH_LOGOUT: "/actions/auth/logout",
    PRODUCT_DELETE: (id: string | number) => `/actions/product/delete/${String(id)}` as const,
    CATEGORY_DELETE: (id: string | number) => `/actions/category/delete/${String(id)}` as const,
  } as const,
} as const;

export const NAV_LINKS = [
  { href: ROUTES.HOME, label: "Home" },
  { href: ROUTES.PRODUCTS, label: "Productos" },
  { href: ROUTES.ORDERS, label: "Mis Ordenes" },
] as const;

export type RouteMap = typeof ROUTES;
