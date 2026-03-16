import {
  type RouteConfig,
  index,
  layout,
  prefix,
  route,
} from "@react-router/dev/routes";

export default [
  // Rutas públicas (tienda)
  layout("./routes/layout.tsx", [
    index("./routes/home/home.tsx"),
    layout("./routes/product/layout.tsx", [
      route("products", "./routes/product/products.tsx"),
    ]),
    route("product/:id", "./routes/product/product.$id.tsx"),
  ]),

  // Rutas del admin
  route("auth/login", "./routes/auth/login.tsx"),
  route("auth/login-action", "./routes/auth/login-action.ts"),
  layout("./routes/admin/layout.tsx", [
    ...prefix("admin", [
      route("logout", "./routes/admin/logout.ts"),
      index("./routes/admin/dashboard/page.tsx"),
      ...prefix("products", [
        route("", "./routes/admin/product/products.tsx"),
        route("new", "./routes/admin/product/product.new.tsx"),
        route(":id", "./routes/admin/product/product.$id.tsx"),
      ]),
      ...prefix("categories", [
        route("", "./routes/admin/category/categories.tsx"),
        route("new", "./routes/admin/category/category.new.tsx"),
        route("/:id", "./routes/admin/category/category.$id.tsx"),
      ])
    ]),
  ])
] satisfies RouteConfig;
