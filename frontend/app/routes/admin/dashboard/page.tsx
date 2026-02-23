import { Suspense } from "react";
import { getToken } from "~/common/services/auth.server";
import { contextProvider, tokenContext } from "~/common/context/context";
import { productService } from "~/common/services/productService";
import { StatsGrid } from "./components/StatsGrid";
import { InventoryValue } from "./components/InventoryValue";
import { SalesValue } from "./components/SalesValue";
import { RecentProducts } from "./components/RecentProducts";
import { QuickActions } from "./components/QuickActions";
import type { Route } from "./+types/page";
import { queryClient } from "~/common/config/query-client";
import { dehydrate, HydrationBoundary, useSuspenseQuery } from "@tanstack/react-query";
import { productStatsQuery, productKeys, productPaginatedQuery, useProductStats } from "~/common/hooks/queries/productQueries";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Dashboard" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);
  token && contextProvider.set(tokenContext, token);

  if (token) {
    await queryClient.ensureQueryData(productStatsQuery(token));
    await queryClient.ensureQueryData(productPaginatedQuery(1, 5, token));
  }

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
  const { data: statsResponse } = useProductStats();
  const { data: products } = useSuspenseQuery({
    queryKey: productKeys.paginated(1, 5),
    queryFn: () => productService.getProductsPaginated(1, 5),
  }).data;

  const stats = statsResponse?.data;

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
