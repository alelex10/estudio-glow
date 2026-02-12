import { StatCard } from "~/common/components/admin/StatCard";
import { Package, AlertTriangle, XCircle, Tag } from "lucide-react";

interface Stats {
  total?: number;
  lowStock?: number;
  withoutStock?: number;
  totalCategory?: number;
}

interface StatsGridProps {
  stats: Stats | undefined;
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
      <StatCard
        title="Total Productos"
        value={stats?.total || 0}
        variant="primary"
        icon={<Package className="w-6 h-6" />}
      />

      <StatCard
        title="Stock Bajo"
        value={stats?.lowStock || 0}
        variant="warning"
        icon={<AlertTriangle className="w-6 h-6" />}
      />

      <StatCard
        title="Sin Stock"
        value={stats?.withoutStock || 0}
        variant="danger"
        icon={<XCircle className="w-6 h-6" />}
      />

      <StatCard
        title="Categorías"
        value={stats?.totalCategory || 0}
        variant="success"
        icon={<Tag className="w-6 h-6" />}
      />
    </div>
  );
}
