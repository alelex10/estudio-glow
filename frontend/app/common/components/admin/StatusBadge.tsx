import { STATUS_CONFIG } from "~/common/constants/order.constants";
import clsx from "clsx";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusCfg = STATUS_CONFIG[status] ?? {
    label: status,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    icon: null,
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border",
        statusCfg.color,
        className
      )}
    >
      {statusCfg.icon}
      {statusCfg.label}
    </span>
  );
}
