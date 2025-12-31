import { ProductCard } from "~/common/components/Card";
import { productService } from "~/common/services/productService";
import type { Route } from "./+types/products";
import {
  queryOptions,
  useQuery,
} from "@tanstack/react-query";
import { queryClient } from "~/common/config/query-client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow | Productos" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

const productListQuery = () =>
  queryOptions({
    queryKey: ["products"],
    queryFn: () => productService.getProductsPaginated(1, 10),
  });

export async function loader() {
  await queryClient.ensureQueryData(productListQuery());
}

export default function ProductsRoute() {
  return <Products />;
}

function Products() {
  const { data: products } = useQuery(productListQuery());

  return (
    <>
      {products?.data.length === 0 && (
        <div className="flex justify-center w-full">
          <p className="text-2xl font-bold ">No hay productos</p>
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4">
        {products?.data.map((product) => (
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
