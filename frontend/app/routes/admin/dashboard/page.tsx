import { Suspense, useEffect, useState } from "react";
import { productService } from "~/common/services/productService";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import { contextProvider, tokenContext } from "~/common/context/context";
import { StatsGrid } from "./components/StatsGrid";
import { InventoryValue } from "./components/InventoryValue";
import { SalesValue } from "./components/SalesValue";
import { RecentProducts } from "./components/RecentProducts";
import { QuickActions } from "./components/QuickActions";
import type { Route } from "./+types/page";
import { queryClient } from "~/common/config/query-client";
import { productStatsQuery, productKeys } from "~/common/hooks/queries/productQuerys";
import { dehydrate, HydrationBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { productPaginatedQuery } from "~/common/hooks/queries/useProductQuerys";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Dashboard" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const cookie = request.headers.get("Cookie");
  const token = cookie?.split(";").find((c) => c.trim().startsWith("token="))?.split("=")[1];
  token && contextProvider.set(tokenContext, token);

  await queryClient.ensureQueryData(productStatsQuery());
  await queryClient.ensureQueryData(productPaginatedQuery(1, 5));

  // const statsData = await productService.getProductStats();
  // const products = await productService.getProductsPaginated(1, 5);

  return {
    dehydratedState: dehydrate(queryClient),
  };
}

export default function AdminDashboardRoute({ loaderData }: Route.ComponentProps) {
  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <Suspense fallback={<div>Cargando productos...</div>}>
        <AdminDashboard />
      </Suspense>
    </HydrationBoundary>
  );
}
function AdminDashboard() {
  const { data: stats } = useSuspenseQuery(productStatsQuery()).data;
  const { data: products } = useSuspenseQuery({
    queryKey: productKeys.paginated(1, 5),
    queryFn: () => productService.getProductsPaginated(1, 5),
  }).data;


  return (
    <div className="space-y-8">
      <StatsGrid stats={stats} />
      <InventoryValue totalValue={stats?.totalValue} />
      <SalesValue totalValue={stats?.totalValue} />
      <RecentProducts products={products} />
      <QuickActions />
    </div>
  );
}
