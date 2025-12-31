import { useState } from "react";
import { ProductCard } from "~/common/components/Card";
import { productService } from "~/common/services/productService";
import type { PaginationResponse } from "~/common/types/response";
import type { Category, Product } from "~/common/types/product-types";
import type { Route } from "./+types/layout";
import {
  QueryClient,
  queryOptions,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { useLoaderData, type LoaderFunctionArgs } from "react-router";
import { getQueryClient, queryClient } from "~/common/config/query-client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow | Productos" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

// export async function loader() {
//   const products = await productService.getProductsPaginated(1, 10);
//   return { products };
// }
// export async function action() {
//   const products = await productService.getProductsFilter(1, 10, "", "", "");
//   const categories = await productService.getCategories();
//   return { products, categories: categories.data };
// }
const productListQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => productService.getProductsPaginated(1, 10),
  });

export async function loader() {
  const queryClient = getQueryClient();
  await queryClient.ensureQueryData(productListQuery());
}

export default function Products() {
  const { data: products } = useSuspenseQuery(productListQuery());

  return (
    <>
      {products.data.length === 0 && (
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
