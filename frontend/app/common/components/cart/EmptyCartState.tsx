import { Button } from "~/common/components/button/Button";
import { ShoppingBag, ArrowRight } from "lucide-react";

interface EmptyCartStateProps {
  onNavigate?: () => void;
}

export function EmptyCartState({ onNavigate }: EmptyCartStateProps) {
  return (
    <div className="text-center py-12 sm:py-16 bg-white rounded-lg border-5 border-primary-400">
      <div className="flex justify-center mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 bg-primary-100 rounded-full flex items-center justify-center">
          <ShoppingBag className="w-10 h-10 sm:w-12 sm:h-12 text-primary-600" />
        </div>
      </div>
      <h2 className="text-xl sm:text-2xl font-semibold text-primary-900 mb-2">Tu carrito está vacío</h2>
      <p className="text-gray-500 mb-6 text-sm sm:text-base px-4">¡Explora nuestro catálogo y encuentra productos increíbles!</p>
      <Button variant="primary" size="lg" className="max-w-xs mx-auto" onClick={onNavigate}>
        Explorar catálogo
        <ArrowRight className="w-5 h-5" />
      </Button>
    </div>
  );
}
