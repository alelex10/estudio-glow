import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  layout("./routes/layout.tsx", [
    index("./routes/home/home.tsx"),
    route("products", "./routes/products/products.tsx"),
    route("product/:id", "./routes/product.$id.tsx"),
  ]),
] satisfies RouteConfig;
