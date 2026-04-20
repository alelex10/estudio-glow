import { CheckCircle, Clock, Receipt, XCircle } from "lucide-react";
import type { TabOption } from "~/common/components/admin/StatusTabs";

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "Pendiente",
    color: "bg-amber-100 text-amber-800 border-amber-200",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  PENDING_VERIFICATION: {
    label: "Verificación",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    icon: <Receipt className="w-3.5 h-3.5" />,
  },
  PAID: {
    label: "Pagado",
    color: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: <CheckCircle className="w-3.5 h-3.5" />,
  },
  CANCELLED: {
    label: "Cancelado",
    color: "bg-red-100 text-red-800 border-red-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  EXPIRED: {
    label: "Expirado",
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
};

export const PAYMENT_CONFIG: Record<string, { label: string; color: string }> = {
  TRANSFER: { label: "Transferencia", color: "bg-purple-100 text-purple-800" },
  MERCADO_PAGO: { label: "Mercado Pago", color: "bg-sky-100 text-sky-800" },
};

export const STATUS_OPTIONS: TabOption[] = [
  { value: "ALL", label: "Todas" },
  { value: "PENDING_VERIFICATION", label: "Verificación" },
  { value: "PAID", label: "Pagadas" },
  { value: "PENDING", label: "Pendientes" },
  { value: "CANCELLED", label: "Canceladas" },
  { value: "EXPIRED", label: "Expiradas" },
];
