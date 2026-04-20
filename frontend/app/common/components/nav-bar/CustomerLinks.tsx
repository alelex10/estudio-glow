import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router";
import { useCart } from "~/common/context/CartContext";

export default function CustomerLinks() {
  const { totalItems } = useCart();
  
  return (
    <div className="flex items-center gap-4">
      <Link to="/favorites" className="hover:text-primary-100 transition-colors">
        <Heart className="w-5 h-5" />
      </Link>
      <Link to="/cart" className="relative hover:text-primary-100 transition-colors">
        <ShoppingBag className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Link>
    </div>
  );
}
