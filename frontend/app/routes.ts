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
    route("products", "./routes/products/products.tsx"),
    route("product/:id", "./routes/product.$id.tsx"),
  ]),

  // Rutas del admin
  route("admin/login", "./routes/admin/login.tsx"),
  layout("./routes/admin/layout.tsx", [
    route("admin", "./routes/admin/dashboard.tsx"),
    route("admin/products", "./routes/admin/products.tsx"),
    route("admin/products/new", "./routes/admin/product.new.tsx"),
    route("admin/products/:id", "./routes/admin/product.$id.tsx"),
  ]),
] satisfies RouteConfig;

