import { useState } from "react";
import { ProductCard } from "~/common/components/Card";
import { productService } from "~/common/services/productService";
import type { Route } from "./+types/products";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow | Productos" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const page = parseInt(url.searchParams.get("page") || "1", 10);
  const limit = parseInt(url.searchParams.get("limit") || "10", 10);
  const q = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const stock = (url.searchParams.get("stock") as "low" | "out" | "ok") || undefined;
  const sortBy = url.searchParams.get("sortBy") || undefined;
  const sortOrder = url.searchParams.get("sortOrder") || undefined;

  const products = await productService.getProductsPaginated(
    page,
    limit,
    q,
    category,
    categoryId,
    stock,
    sortBy,
    sortOrder
  );
  return { products };
}


export default function Products({ loaderData }: Route.ComponentProps) {
  const { products } = loaderData;

  return (
    <>
      {products?.data.length === 0 && (
        <div className="flex justify-center w-full">
          <p className="text-2xl font-bold ">No hay productos</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4">
        {products.data.map((product) => (
          <div key={product.id}>
            <ProductCard
              productId={product.id}
              imageUrl={product.imageUrl}
              name={product.name}
              price={product.price}
            />
          </div>
        ))}
      </div>
    </>
  );
}
