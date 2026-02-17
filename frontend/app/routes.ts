import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Rutas públicas (tienda)
  layout("./routes/layout.tsx", [
    index("./routes/home/home.tsx"),
    layout("./routes/products/layout.tsx", [
      route("products", "./routes/products/products.tsx"),
    ]),
    route("product/:id", "./routes/products/product.$id.tsx"),
    route("test", "./routes/page-test/test.tsx"),
    route("test-2", "./routes/page-test/test-2.tsx"),
  ]),

  // Rutas del admin
  route("auth/login", "./routes/auth/login.tsx"),
  route("auth/login-action", "./routes/auth/login-action.ts"),
  route("admin/logout", "./routes/admin/logout.ts"),
  layout("./routes/admin/layout.tsx", [
    route("admin", "./routes/admin/dashboard/page.tsx"),
    route("admin/products", "./routes/admin/products.tsx"),
    route("admin/products/new", "./routes/admin/product.new.tsx"),
    route("admin/products/:id", "./routes/admin/product.$id.tsx"),
    route("admin/categories", "./routes/admin/categories.tsx"),
    route("admin/categories/new", "./routes/admin/category.new.tsx"),
    route("admin/categories/:id", "./routes/admin/category.$id.tsx"),
  ]),
  route("test-auth", "./routes/test-auth.tsx"),
  // Rutas de pruebas
] satisfies RouteConfig;
