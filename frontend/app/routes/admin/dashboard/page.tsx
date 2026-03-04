import { Suspense } from "react";
import { getToken } from "~/common/services/auth.server";
import { StatsGrid } from "./components/StatsGrid";
import { InventoryValue } from "./components/InventoryValue";
import { SalesValue } from "./components/SalesValue";
import { RecentProducts } from "./components/RecentProducts";
import { QuickActions } from "./components/QuickActions";
import type { Route } from "./+types/page";
import { queryClient } from "~/common/config/query-client";
import {
  dehydrate,
  HydrationBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  productStatsQuery,
  productPaginatedQuery,
} from "~/common/hooks/queries/productQueries";
import { redirect } from "react-router";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Dashboard" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);

  if (!token) {
    throw redirect("/auth/login");
  }

  await queryClient.ensureQueryData(productStatsQuery(token));
  await queryClient.ensureQueryData(productPaginatedQuery(1, 5));

  return {
    dehydratedState: dehydrate(queryClient),
    token,
  };
}

export default function AdminDashboardRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <Suspense fallback={<div>Cargando productos...</div>}>
        <AdminDashboard token={loaderData.token} />
      </Suspense>
    </HydrationBoundary>
  );
}
function AdminDashboard({ token }: { token: string }) {
  const { data: statsResponse } = useSuspenseQuery(productStatsQuery(token));
  const { data: products } = useSuspenseQuery(productPaginatedQuery(1, 5));

  const stats = statsResponse?.data;
  const productsList = products?.data;  

  return (
    <div className="space-y-8">
      <StatsGrid stats={stats} />
      <InventoryValue totalValue={stats?.totalValue} />
      <SalesValue totalValue={stats?.totalValue} />
      <RecentProducts products={productsList} />
      <QuickActions />
    </div>
  );
}
