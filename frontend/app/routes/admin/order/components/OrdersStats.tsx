import { StatCard } from "~/common/components/admin/StatCard";
import { CheckCircle, Receipt, XCircle } from "lucide-react";

interface OrdersStatsProps {
  totalItems: number;
  orders: any[];
}

export function OrdersStats({ totalItems, orders }: OrdersStatsProps) {
  const verificationCount = orders.filter((o: any) => o.status === "PENDING_VERIFICATION").length;
  const paidCount = orders.filter((o: any) => o.status === "PAID").length;
  const cancelledCount = orders.filter((o: any) => o.status === "CANCELLED" || o.status === "EXPIRED").length;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard
        title="Total órdenes"
        value={totalItems || 0}
        icon={<Receipt className="w-6 h-6" />}
        variant="primary"
      />
      <StatCard
        title="Verificación"
        value={verificationCount}
        icon={<Receipt className="w-6 h-6" />}
        variant="warning"
      />
      <StatCard
        title="Pagadas"
        value={paidCount}
        icon={<CheckCircle className="w-6 h-6" />}
        variant="success"
      />
      <StatCard
        title="Canceladas"
        value={cancelledCount}
        icon={<XCircle className="w-6 h-6" />}
        variant="danger"
      />
    </div>
  );
}
