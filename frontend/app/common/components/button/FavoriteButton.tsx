import { Heart } from "lucide-react";
import clsx from "clsx";
import type { UUID } from "crypto";
import { useFavorites } from "~/common/context/FavoritesContext";

interface FavoriteButtonProps {
  productId: UUID;
  className?: string;
  size?: "sm" | "md" | "lg";
  isFav?: boolean; // deprecated, ignored — kept for backward compat
}

export function FavoriteButton({
  productId,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const { isFav, toggleFavorite, isLoading } = useFavorites();
  const favorited = isFav(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    toggleFavorite(productId);
  };

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-11 h-11",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-6 h-6",
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isLoading}
      className={clsx(
        "rounded-full flex items-center justify-center transition-all duration-300",
        "hover:scale-110 active:scale-95",
        sizeClasses[size],
        favorited
          ? "bg-danger-100 text-danger-500 border-3 border-danger-400 hover:bg-danger-200"
          : "bg-white text-primary-400 border-3 border-primary-300 hover:bg-primary-50 hover:text-primary-500",
        "shadow-lg hover:shadow-xl",
        isLoading && "opacity-50 cursor-not-allowed",
        className,
      )}
      aria-label={
        favorited ? "Quitar de favoritos" : "Agregar a favoritos"
      }
    >
      <Heart
        className={clsx(
          iconSizes[size],
          "transition-all duration-300",
          favorited &&
            "fill-current animate-[heartbeat_0.3s_ease-in-out]",
        )}
      />
    </button>
  );
}
