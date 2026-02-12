import { useEffect, useState } from "react";
import { productService } from "~/common/services/productService";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import { contextProvider, tokenContext } from "~/common/context/context";
import { StatsGrid } from "./components/StatsGrid";
import { InventoryValue } from "./components/InventoryValue";
import { SalesValue } from "./components/SalesValue";
import { RecentProducts } from "./components/RecentProducts";
import { QuickActions } from "./components/QuickActions";
import type { Route } from "./+types/page";

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

  const statsData = await productService.getProductStats();
  const products = await productService.getProductsPaginated(1, 5);

  return {
    stats: statsData.data,
    products: products.data,
  };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  const { stats, products } = loaderData;


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
