import { Lock } from "lucide-react";

interface OrderSummarySidebarProps {
  totalItems: number;
  totalPrice: number;
  actionButton?: React.ReactNode;
}

export function OrderSummarySidebar({ totalItems, totalPrice, actionButton }: OrderSummarySidebarProps) {
  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg border-5 border-primary-400 shadow-lg lg:sticky lg:top-4">
      <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 sm:mb-6 pb-4 border-b-2 border-primary-200">
        Resumen
      </h2>

      <div className="space-y-3 mb-4 sm:mb-6">
        <div className="flex justify-between text-gray-600 text-sm sm:text-base">
          <span>Subtotal ({totalItems} items)</span>
          <span className="font-semibold">${totalPrice.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-gray-600 text-sm sm:text-base">
          <span>Envío</span>
          <span className="font-semibold text-success-600">Gratis</span>
        </div>
        <div className="flex justify-between text-gray-600 text-sm sm:text-base">
          <span>Impuestos</span>
          <span className="font-semibold text-xs sm:text-base">Calculado al checkout</span>
        </div>
      </div>

      <div className="border-t-2 border-primary-200 pt-4 mb-4 sm:mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg sm:text-xl font-bold text-primary-900">Total</span>
          <span className="text-2xl sm:text-3xl font-bold text-primary-900">
            ${totalPrice.toFixed(2)}
          </span>
        </div>
      </div>

      {actionButton && (
        <div className="mb-3">
          {actionButton}
        </div>
      )}

      <div className="p-3 sm:p-4 bg-primary-50 rounded-lg border-2 border-primary-200">
        <p className="text-xs sm:text-sm text-primary-700 text-center flex items-center justify-center gap-2">
          <Lock className="w-4 h-4" />
          Pago seguro y protegido
        </p>
      </div>
    </div>
  );
}
