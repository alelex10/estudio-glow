import { Heart } from "lucide-react";
import clsx from "clsx";
import type { UUID } from "crypto";
import { useFetcher } from "react-router";
import { useState } from "react";

interface FavoriteButtonProps {
  productId: UUID;
  className?: string;
  size?: "sm" | "md" | "lg";
  isFav: boolean;
}

export function FavoriteButton({
  isFav,
  productId,
  className,
  size = "md",
}: FavoriteButtonProps) {
  const [isFavState, setIsFavState] = useState(isFav);
  const fetcher = useFetcher();

  const isSubmitting = fetcher.state !== "idle";

  const optimisticIsFav = fetcher.formData
    ? fetcher.formData.get("isFavorite") === "true"
    : isFav;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsFavState(!isFavState);
    if (isSubmitting) return;

    const action = optimisticIsFav
      ? `/actions/favorite/remove/${productId}`
      : `/actions/favorite/add/${productId}`;

    const method = optimisticIsFav ? "DELETE" : "POST";
    fetcher.submit(
      { productId, isFavorite: !optimisticIsFav },
      {
        method,
        action,
      },
    );
  };
  
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
      onClick={handleClick}
      className={clsx(
        "rounded-full flex items-center justify-center transition-all duration-300",
        "hover:scale-110 active:scale-95",
        sizeClasses[size],
        isFavState
          ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
          : "bg-white/80 backdrop-blur-sm text-gray-400 hover:text-red-400 hover:bg-white",
        "shadow-lg hover:shadow-xl",
        className,
      )}
      aria-label={
        isFavState ? "Quitar de favoritos" : "Agregar a favoritos"
      }
    >
      <Heart
        className={clsx(
          iconSizes[size],
          "transition-all duration-300",
          isFavState &&
            "fill-current animate-[heartbeat_0.3s_ease-in-out]",
        )}
      />
    </button>
  );
}
