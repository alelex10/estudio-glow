import { Heart, ShoppingBag } from "lucide-react";
import { Link } from "react-router";

export default function CustomerLinks() {
  return (
    <>
      <Link to="/favorites" className="hover:text-primary-100 transition-colors">
        <Heart className="w-5 h-5" />
      </Link>
      <Link 
        to="/cart" 
        className="hover:text-primary-100 transition-colors opacity-50 cursor-not-allowed" 
        title="Próximamente"
      >
        <ShoppingBag className="w-5 h-5" />
      </Link>
    </>
  );
}
