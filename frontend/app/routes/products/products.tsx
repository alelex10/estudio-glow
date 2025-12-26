import { useState } from "react";
import { ProductCard } from "~/common/components/Card";
import { productService } from "~/common/services/productService";
import type { PaginationResponse } from "~/common/types/response";
import type { Category, Product } from "~/common/types/product-types";
import type { Route } from "./+types/layout";
import { queryClient } from "~/common/lib/query-client";
import {
  dehydrate,
  QueryClient,
  useQuery,
  type DehydratedState,
} from "@tanstack/react-query";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow | Productos" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader() {
  const queryClient = new QueryClient();
  // Pre-cargar los datos en la caché del servidor
  await queryClient.prefetchQuery({
    queryKey: ["products", 1, 10],
    queryFn: () => productService.getProductsPaginated(1, 10),
  });

  return { dehydratedState: dehydrate(queryClient) };
}
export async function action() {
  const products = await productService.getProductsFilter(1, 10, "", "", "");
  const categories = await productService.getCategories();
  return { products, categories: categories.data };
}
interface Props {
  loaderData: { dehydratedState: DehydratedState };
  sort: { sortBy: string; sortOrder: string };
}

export default function Products({ loaderData, sort }: Props) {
  const { data } = useQuery({
    queryKey: ["products", 1, 10],
    queryFn: () => productService.getProductsPaginated(1, 10),
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const { dehydratedState } = loaderData;
  const [products, setProducts] = useState(data?.data);
  const [isSortOpen, setIsSortOpen] = useState(false);
  // const { sortBy, sortOrder } = sort;

  const [filter, setFilter] = useState({
    category: "",
    sortOrder: "asc",
    sortBy: "price",
  });

  return (
    <>
      {products?.length === 0 && (
        <div className="flex justify-center w-full">
          <p className="text-2xl font-bold ">No hay productos</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4">
        {products?.map((product) => (
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
