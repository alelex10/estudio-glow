import clsx from "clsx";

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
                styles.bg,
                className
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p
                        className={clsx(
                            "text-sm font-medium mb-1",
                            variant === "default" ? "text-gray-500" : "text-white/80"
                        )}
                    >
                        {title}
                    </p>
                    <p className={clsx("text-3xl font-bold", styles.text)}>
                        {typeof value === "number" ? value.toLocaleString() : value}
                    </p>

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
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                                    </svg>
                                ) : (
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                                    </svg>
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

                <div className={clsx("p-3 rounded-xl", styles.icon)}>{icon}</div>
            </div>
        </div>
    );
}
