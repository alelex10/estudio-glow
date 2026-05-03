import clsx from "clsx";
import { Link } from "react-router";
import { FavoriteButton } from "./button/FavoriteButton";
import { CartButton } from "./button/CartButton";
import type { UUID } from "crypto";
import { useCart } from "~/common/context/CartContext";
import { getCloudinaryUrl } from "~/common/lib/utils";

interface ProductCardProps {
  imageUrl: string;
  name: string;
  price: number;
  productId: UUID;
  isFav?: boolean;
}

export function ProductCard({
  imageUrl,
  name,
  price,
  productId,
  isFav = false,
}: ProductCardProps) {
  const { addToCart } = useCart();
  
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart({ productId, name, price, imageUrl, quantity: 1 });
  };

  return (
    <div className="p-2">
      <Link to={`/product/${productId}`}>
        <div
          className={clsx(
            "bg-white p-3 pb-4 max-w-[300px] mx-auto",
            "border-5 border-primary-400",
            "outline-2 outline-primary-400 outline-offset-2",
            "flex flex-col gap-3",
          )}
        >
          <div className="relative aspect-4/5 overflow-hidden bg-gray-50">
            <img
              src={getCloudinaryUrl(imageUrl, 400)}
              alt={name}
              loading="lazy"
              className="w-full h-full object-cover object-center hover:scale-105 transition-transform duration-500"
            />
          </div>

          <div className="text-left flex flex-col gap-1">
            <h2 className="text-sm font-medium text-gray-900 uppercase tracking-wide">
              {name}
            </h2>
            <div className="flex items-end justify-between gap-2">
              <p className="text-sm text-gray-600 mb-2">${price.toFixed(2)}</p>
              <div className="flex gap-2">
                <FavoriteButton size="md" productId={productId} isFav={isFav} />
                <CartButton 
                  size="md"
                  onClick={handleAddToCart}
                />
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
