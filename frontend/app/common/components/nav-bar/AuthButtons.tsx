import { Link } from "react-router";
import { Button } from "../button/Button";
import { AUTH } from "../../constants/rute-client";
import { ShoppingBag } from "lucide-react";
import { useCart } from "~/common/context/CartContext";

export default function AuthButtons() {
  const { totalItems } = useCart();
  
  return (
    <div className="flex items-center gap-4">
      <Link to="/cart" className="relative hover:text-primary-100 transition-colors text-white mr-2">
        <ShoppingBag className="w-5 h-5" />
        {totalItems > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Link>
      <Link to={AUTH.REGISTER()}>
        <Button variant="outline" className="border-white text-white hover:bg-white hover:text-primary-800">
          Registrarse
        </Button>
      </Link>
      <Link to={AUTH.LOGIN()}>
        <Button className="bg-primary-100">Login</Button>
      </Link>
    </div>
  );
}
