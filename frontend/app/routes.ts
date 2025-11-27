import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
    layout("./routes/layout.tsx", [
        index("./routes/home/home.tsx"),
        route("products", "./routes/products/products.tsx")
    ])
] satisfies RouteConfig;
