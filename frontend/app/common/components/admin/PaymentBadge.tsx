import { PAYMENT_CONFIG } from "~/common/constants/order.constants";
import { CreditCard } from "lucide-react";
import clsx from "clsx";

interface PaymentBadgeProps {
  paymentMethod: string;
  className?: string;
}

export function PaymentBadge({ paymentMethod, className }: PaymentBadgeProps) {
  const paymentCfg = PAYMENT_CONFIG[paymentMethod] ?? {
    label: paymentMethod,
    color: "bg-gray-100 text-gray-600",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full",
        paymentCfg.color,
        className
      )}
    >
      <CreditCard className="w-3 h-3" />
      {paymentCfg.label}
    </span>
  );
}
