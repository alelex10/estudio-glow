import { Suspense } from "react";
import { Await } from "react-router";
import { requireAuth } from "~/common/actions/auth-helpers";
import { StatsGrid } from "./components/StatsGrid";
import { InventoryValue } from "./components/InventoryValue";
import { SalesValue } from "./components/SalesValue";
import { RecentProducts } from "./components/RecentProducts";
import { QuickActions } from "./components/QuickActions";
import { 
  StatsGridSkeleton, 
  RecentProductsSkeleton,
  InventoryValueSkeleton,
  SalesValueSkeleton
} from "./components/DashboardSkeletons";
import type { Route } from "./+types/page";
import { productService } from "~/common/services/productService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Dashboard" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await requireAuth(request);

  return {
    stats: productService.getProductStats(token),
    products: productService.getProductsPaginated(1, 5),
    token,
  };
}

export default function AdminDashboard({ loaderData }: Route.ComponentProps) {
  return (
    <div className="space-y-8">
      <Suspense fallback={<StatsGridSkeleton />}>
        <Await resolve={loaderData.stats}>
          {(stats) => <StatsGrid stats={stats?.data} />}
        </Await>
      </Suspense>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Suspense fallback={<InventoryValueSkeleton />}>
          <Await resolve={loaderData.stats}>
            {(stats) => <InventoryValue totalValue={stats?.data?.totalValue} />}
          </Await>
        </Suspense>

        <Suspense fallback={<SalesValueSkeleton />}>
          <Await resolve={loaderData.stats}>
            {(stats) => <SalesValue totalValue={stats?.data?.totalValue} />}
          </Await>
        </Suspense>
      </div>

      <Suspense fallback={<RecentProductsSkeleton />}>
        <Await resolve={loaderData.products}>
          {(products) => <RecentProducts products={products?.data} />}
        </Await>
      </Suspense>

      <QuickActions />
    </div>
  );
}
