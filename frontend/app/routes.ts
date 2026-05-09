import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";
import { ROUTES, path } from "./common/constants/routes";

export default [
  // Rutas públicas (tienda)
  layout("./routes/layout.tsx", [
    index("./routes/home/home.tsx"),
    layout("./routes/product/layout.tsx", [
      route(path(ROUTES.PRODUCTS), "./routes/product/products.tsx"),
    ]),
    route(path(ROUTES.PRODUCT(":id")), "./routes/product/product.$id.tsx"),

    // Rutas protegidas/cliente que usan el layout principal
    route(path(ROUTES.FAVORITES), "./routes/favorites/favorites.tsx"),
    route(path(ROUTES.CART), "./routes/cart/cart.tsx"),
    route(path(ROUTES.CHECKOUT), "./routes/checkout/checkout.tsx"),
    route(path(ROUTES.ORDERS), "./routes/orders/orders.tsx"),
  ]),

  // Rutas de autenticación
  route(path(ROUTES.REGISTER), "./routes/auth/register.tsx"),
  route(path(ROUTES.LOGIN), "./routes/auth/login.tsx"),

  layout("./routes/admin/layout.tsx", [
    ...prefix(path(ROUTES.admin.BASE), [
      index("./routes/admin/dashboard/page.tsx"),
      ...prefix(path(ROUTES.admin.PRODUCTS, "admin"), [
        index("./routes/admin/product/products.tsx"),
        route(path(ROUTES.admin.PRODUCTS_NEW, "admin/products"), "./routes/admin/product/product.new.tsx"),
        route(path(ROUTES.admin.PRODUCT(":id"), "admin/products"), "./routes/admin/product/product.$id.tsx"),
      ]),
      ...prefix(path(ROUTES.admin.CATEGORIES, "admin"), [
        index("./routes/admin/category/categories.tsx"),
        route(
          path(ROUTES.admin.CATEGORIES_NEW, "admin/categories"),
          "./routes/admin/category/category.new.tsx"
        ),
        route(
          path(ROUTES.admin.CATEGORY(":id"), "admin/categories"),
          "./routes/admin/category/category.$id.tsx"
        ),
      ]),
      route(path(ROUTES.admin.ORDERS, "admin"), "./routes/admin/order/order.tsx"),
    ]),
  ]),

  // Actions
  ...prefix("actions", [
    // Category actions
    ...prefix("category", [
      route(
        path(ROUTES.actions.CATEGORY_DELETE(":id"), "actions/category"),
        "./actions/category/category-delete.$id.tsx"
      ),
    ]),
    // Product actions
    ...prefix("product", [
      route(
        path(ROUTES.actions.PRODUCT_DELETE(":id"), "actions/product"),
        "./actions/product/product-delete.$id.tsx"
      ),
    ]),
    // Favorite actions
    ...prefix("favorite", [
      route(
        path(ROUTES.actions.FAVORITE_ADD(":productId"), "actions/favorite"),
        "./actions/favorite/add.$id.tsx"
      ),
      route(
        path(ROUTES.actions.FAVORITE_REMOVE(":productId"), "actions/favorite"),
        "./actions/favorite/remove.$id.tsx"
      ),
    ]),
    // Auth actions
    ...prefix("auth", [
      route(
        path(ROUTES.actions.AUTH_LOGIN, "actions/auth"),
        "./actions/auth/login-action.tsx"
      ),
      route(
        path(ROUTES.actions.AUTH_REGISTER, "actions/auth"),
        "./actions/auth/register-action.tsx"
      ),
      route(
        path(ROUTES.actions.AUTH_LOGOUT, "actions/auth"),
        "./actions/auth/logout.tsx"
      ),
      route(
        path(ROUTES.actions.AUTH_GOOGLE, "actions/auth"),
        "./actions/auth/google-login-action.tsx"
      ),
    ]),
  ]),
] satisfies RouteConfig;
