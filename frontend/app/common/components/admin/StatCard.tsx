import clsx from "clsx";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "primary" | "success" | "warning" | "danger";
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  const variantStyles = {
    default: {
      bg: "bg-white",
      icon: "bg-gray-100 text-gray-600",
      text: "text-gray-900",
    },
    primary: {
      bg: "bg-gradient-to-br from-primary-400 to-primary-600",
      icon: "bg-white/20 text-white",
      text: "text-white",
    },
    success: {
      bg: "bg-gradient-to-br from-green-400 to-green-600",
      icon: "bg-white/20 text-white",
      text: "text-white",
    },
    warning: {
      bg: "bg-gradient-to-br from-amber-400 to-amber-600",
      icon: "bg-white/20 text-white",
      text: "text-white",
    },
    danger: {
      bg: "bg-gradient-to-br from-red-400 to-red-600",
      icon: "bg-white/20 text-white",
      text: "text-white",
    },
  };

  const styles = variantStyles[variant];

  return (
    <div
      className={clsx(
        "rounded-xl p-6 shadow-lg",
        "border border-gray-100",
        "transition-transform duration-200 hover:scale-[1.02]",
        "h-32",
        styles.bg,
        className
      )}
    >
      <div className="flex justify-between flex-col ">
        <div className="flex justify-between ">
          <p
            className={clsx(
              "text-sm font-medium mb-1 self-center",
              variant === "default" ? "text-gray-500" : "text-white/80"
            )}
          >
            {title}
          </p>
          <div className={clsx("p-3 rounded-xl", styles.icon)}>{icon}</div>
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <span
                className={clsx(
                  "text-xs font-medium flex items-center gap-1",
                  trend.isPositive ? "text-green-500" : "text-red-500",
                  variant !== "default" && "text-white/90"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="w-3 h-3" />
                ) : (
                  <TrendingDown className="w-3 h-3" />
                )}
                {Math.abs(trend.value)}%
              </span>
              <span
                className={clsx(
                  "text-xs",
                  variant === "default" ? "text-gray-400" : "text-white/70"
                )}
              >
                vs mes anterior
              </span>
            </div>
          )}
        </div>
        <p className={clsx("text-3xl font-bold", styles.text)}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </p>
      </div>
    </div>
  );
}
