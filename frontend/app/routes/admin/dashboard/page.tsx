import { Suspense } from "react";
import { getToken } from "~/common/services/auth.server";
import { StatsGrid } from "./components/StatsGrid";
import { InventoryValue } from "./components/InventoryValue";
import { SalesValue } from "./components/SalesValue";
import { RecentProducts } from "./components/RecentProducts";
import { QuickActions } from "./components/QuickActions";
import type { Route } from "./+types/page";
import { productService } from "~/common/services/productService";
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

  const statsResponse = await productService.getProductStats(token);
  const products = await productService.getProductsPaginated(1, 5);

  return {
    stats: statsResponse.data,
    products: products.data,
    token,
  };
}

export default function AdminDashboardRoute({
  loaderData,
}: Route.ComponentProps) {
  return (
    <Suspense fallback={<div>Cargando productos...</div>}>
      <AdminDashboard 
        stats={loaderData.stats} 
        products={loaderData.products}
        token={loaderData.token} 
      />
    </Suspense>
  );
}
function AdminDashboard({ 
  stats, 
  products, 
  token 
}: { 
  stats: any; 
  products: any; 
  token: string 
}) {
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
