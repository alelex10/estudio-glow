import { X } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { PaymentBadge } from "./PaymentBadge";

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  priceAtPurchase: number;
  product: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface OrderWithItems {
  id: string;
  userId: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
}

interface OrderDetailModalProps {
  order: OrderWithItems | null;
  onClose: () => void;
  isLoading?: boolean;
}

export function OrderDetailModal({ order, onClose, isLoading }: OrderDetailModalProps) {
  if (!order) return null;

  const formatPrice = (price: number) => {
    return `$${price.toLocaleString("en-US", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
          <div className="sticky top-0 bg-linear-to-r from-gray-50 to-white border-b border-gray-200 p-4 sm:p-6 flex items-start sm:items-center justify-between gap-4">
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Detalle del Pedido</h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors active:scale-95 shrink-0"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-6">
            {/* Order Info */}
            <div className="bg-linear-to-br from-gray-50 to-white rounded-xl p-4 sm:p-5 border border-gray-100">
              <h3 className="text-xs sm:text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3 sm:mb-4">Información del Pedido</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Fecha</span>
                  <p className="text-xs sm:text-sm font-medium text-gray-900">{formatDate(order.createdAt)}</p>
                </div>
                <div className="space-y-1 flex flex-col">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Estado</span>
                  <StatusBadge status={order.status} className="px-2 py-0.5 sm:px-3 sm:py-1" />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">Método de Pago</span>
                  <PaymentBadge paymentMethod={order.paymentMethod} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-gray-400 uppercase tracking-wide">ID de Usuario</span>
                  <p className="font-mono text-xs sm:text-xs text-gray-900">#{order.userId.slice(0, 8).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                <span className="w-1 h-5 sm:h-6 bg-primary-600 rounded-full shrink-0"></span>
                Productos
              </h3>
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 rounded-xl border border-gray-100">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-xl animate-pulse shrink-0" />
                      <div className="flex-1 space-y-2 min-w-0">
                        <div className="h-4 sm:h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                        <div className="h-3 sm:h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
                      </div>
                      <div className="text-right shrink-0">
                        <div className="h-5 sm:h-6 bg-gray-200 rounded w-16 sm:w-20 animate-pulse" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : !order.items || order.items.length === 0 ? (
                <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-sm sm:text-base text-gray-500">No hay productos en esta orden.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
                  >
                    {item.product.imageUrl ? (
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-xl shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-gray-400 text-xs">Sin imagen</span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-semibold text-gray-900 truncate">{item.product.name}</p>
                      <div className="flex items-center gap-3 sm:gap-4 mt-1">
                        <p className="text-xs sm:text-sm text-gray-500">
                          <span className="font-medium text-gray-700">{item.quantity}</span> x {formatPrice(item.priceAtPurchase)}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {formatPrice(item.priceAtPurchase * item.quantity)}
                      </p>
                    </div>
                  </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="bg-linear-to-r from-primary-50 to-primary-100 rounded-xl p-4 sm:p-6 border border-primary-200">
              <div className="flex justify-between items-center gap-4">
                <div>
                  <span className="text-xs sm:text-sm font-semibold text-gray-600 uppercase tracking-wider">Total del Pedido</span>
                </div>
                <span className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {formatPrice(order.totalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
