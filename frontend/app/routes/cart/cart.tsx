import { Link, useNavigate } from "react-router";
import { useCart } from "../../common/context/CartContext";
import { ArrowRight } from "lucide-react";
import { Button } from "~/common/components/button/Button";
import { EmptyCartState } from "~/common/components/cart/EmptyCartState";
import { CartItemsList } from "~/common/components/cart/CartItemsList";
import { OrderSummarySidebar } from "~/common/components/cart/OrderSummarySidebar";
import type { Route } from "./+types/cart";
import { useEffect } from "react";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Carrito | Glow Studio" },
    { name: "description", content: "Carrito de compras de Glow Studio" },
  ];
}

export default function Cart() {
  const { items, removeFromCart, updateQuantity, refreshStock, totalPrice, totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    refreshStock();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-primary-900 mb-2">Tu Carrito</h1>
        <p className="text-gray-600 text-sm sm:text-base">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
      </div>

      {items.length === 0 ? (
        <EmptyCartState onNavigate={() => navigate('/products')} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4">
            <CartItemsList 
              items={items} 
              readonly={false} 
              onUpdateQuantity={updateQuantity} 
              onRemove={removeFromCart} 
            />
          </div>

          <div className="lg:col-span-1 order-first lg:order-last">
            <OrderSummarySidebar 
              totalItems={totalItems} 
              totalPrice={totalPrice} 
              actionButton={
                <>
                  <Button
                    variant="gold"
                    size="lg"
                    onClick={() => navigate('/checkout')}
                    className="w-full mb-3 py-3 sm:py-2"
                  >
                    Proceder al Pago
                    <ArrowRight className="w-5 h-5" />
                  </Button>

                  <Link to="/products">
                    <Button variant="outline" size="md" className="w-full">
                      Seguir comprando
                    </Button>
                  </Link>
                </>
              } 
            />
          </div>
        </div>
      )}
    </div>
  );
}
