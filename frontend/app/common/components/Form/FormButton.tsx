import type { ReactNode } from "react";
import clsx from "clsx";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";

interface FormButtonProps {
  type?: "submit" | "button";
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  children: ReactNode;
  className?: string;
}

export function FormButton({
  type = "submit",
  disabled = false,
  isLoading = false,
  loadingText = "Cargando...",
  children,
  className = "",
}: FormButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={clsx(
        "w-full py-3 px-4 rounded-xl",
        "bg-linear-to-r from-primary-500 to-primary-600",
        "text-white font-semibold",
        "hover:from-primary-600 hover:to-primary-700",
        "focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-gray-900",
        "transition-all duration-200",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "flex items-center justify-center gap-2",
        className
      )}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {isLoading ? loadingText : children}
    </button>
  );
}
