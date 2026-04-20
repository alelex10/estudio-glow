import { ShoppingCart } from "lucide-react";
import clsx from "clsx";

interface CartButtonProps {
  onClick?: (e: React.MouseEvent) => void;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  ariaLabel?: string;
}

export function CartButton({
  onClick,
  className,
  size = "md",
  disabled = false,
  ariaLabel = "Añadir al carrito",
}: CartButtonProps) {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "rounded-full flex items-center justify-center transition-all duration-300",
        "hover:scale-110 active:scale-95",
        "bg-white text-primary-400 border-3 border-primary-300 hover:bg-primary-50 hover:text-primary-500",
        "shadow-lg hover:shadow-xl",
        sizeClasses[size],
        disabled && "opacity-50 cursor-not-allowed hover:scale-100",
        className,
      )}
      aria-label={ariaLabel}
    >
      <ShoppingCart
        className={clsx(
          iconSizes[size],
          "transition-all duration-300",
        )}
      />
    </button>
  );
}
