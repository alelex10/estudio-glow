import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";
import { AUTH } from "./common/constants/rute-client";

const BASE_ROUTE = "./routes/";
const EXTENSION = ".tsx";

export default [
  // Rutas públicas (tienda)
  layout("./routes/layout.tsx", [
    index("./routes/home/home.tsx"),
    layout("./routes/product/layout.tsx", [
      route("products", "./routes/product/products.tsx"),
    ]),
    route("product/:id", "./routes/product/product.$id.tsx"),
  ]),

  // Rutas de autenticación
  route(`${AUTH.REGISTER()}`, `${BASE_ROUTE}${AUTH.REGISTER()}${EXTENSION}`),
  route("login", "./routes/auth/login.tsx"),

  route("favorites", "./routes/favorites/favorites.tsx"),
  layout("./routes/admin/layout.tsx", [
    ...prefix("admin", [
      index("./routes/admin/dashboard/page.tsx"),
      ...prefix("products", [
        index("./routes/admin/product/products.tsx"),
        route("new", "./routes/admin/product/product.new.tsx"),
        route(":id", "./routes/admin/product/product.$id.tsx"),
      ]),
      ...prefix("categories", [
        index("./routes/admin/category/categories.tsx"),
        route("new", "./routes/admin/category/category.new.tsx"),
        route("/:id", "./routes/admin/category/category.$id.tsx"),
      ]),
    ]),
  ]),

  // Actions
  ...prefix("actions", [
    // Category actions
    ...prefix("category", [
      route("delete/:id", "./actions/category/category-delete.$id.tsx"),
    ]),
    // Product actions
    ...prefix("product", [
      route("delete/:id", "./actions/product/product-delete.$id.tsx"),
    ]),
    // Favorite actions
    ...prefix("favorite", [
      route("add/:productId", "./actions/favorite/add.$id.tsx"),
      route("remove/:productId", "./actions/favorite/remove.$id.tsx"),
    ]),
    // Auth actions
    ...prefix("auth", [
      route("login-action", "./actions/auth/login-action.tsx"),
      route("register-action", "./actions/auth/register-action.tsx"),
      route("logout", "./actions/auth/logout.tsx"),
      route("google-login-action", "./actions/auth/google-login-action.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
