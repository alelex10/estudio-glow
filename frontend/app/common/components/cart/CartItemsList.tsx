import { Trash2, Plus, Minus } from "lucide-react";
import clsx from "clsx";
import { getCloudinaryUrl } from "~/common/lib/utils";

interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl?: string;
  stock?: number;
}

interface CartItemsListProps {
  items: CartItem[];
  readonly?: boolean;
  onUpdateQuantity?: (productId: string, newQuantity: number) => void;
  onRemove?: (productId: string) => void;
}

export function CartItemsList({ items, readonly = false, onUpdateQuantity, onRemove }: CartItemsListProps) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <div
          key={item.productId}
          className="bg-white p-4 rounded-lg border-5 border-primary-400 shadow-lg flex flex-col sm:flex-row gap-4 sm:gap-4 items-start sm:items-center"
        >
          {item.imageUrl && (
            <div className="w-full sm:w-24 h-32 sm:h-24 shrink-0 bg-gray-50 rounded-lg overflow-hidden mx-auto sm:mx-0">
              <img
                src={getCloudinaryUrl(item.imageUrl, 200)}
                alt={item.name}
                loading="lazy"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 w-full">
            <h3 className="font-semibold text-primary-900 text-base sm:text-lg mb-1 truncate">{item.name}</h3>
            <p className="text-primary-600 font-bold text-lg sm:text-xl">${item.price.toFixed(2)}</p>
            {!readonly && (
              <>
                <p className="text-gray-600 text-sm sm:text-base">Cantidad: {item.quantity}</p>
                {item.stock !== undefined && (
                  <p className="text-sm sm:text-base">
                    Stock disponible: <span className={clsx("font-medium", item.stock - item.quantity <= 2 ? "text-orange-600" : "text-green-600")}>{item.stock}</span>
                  </p>
                )}
              </>
            )}
          </div>

          <div className="flex flex-row sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto justify-between sm:justify-start">
            {!readonly && (
              <div className="flex items-center bg-primary-50 rounded-lg border-2 border-primary-300">
                <button
                  onClick={() => onUpdateQuantity?.(item.productId, item.quantity - 1)}
                  className="p-3 sm:p-2 hover:bg-primary-100 rounded-l-lg transition-colors active:scale-95"
                  aria-label="Disminuir cantidad"
                >
                  <Minus className="w-5 h-5 sm:w-4 sm:h-4 text-primary-700" />
                </button>
                <span className="px-4 py-3 sm:px-3 sm:py-2 font-semibold text-primary-900 min-w-14 sm:min-w-12 text-center text-lg sm:text-base">
                  {item.quantity}
                </span>
                <button
                  onClick={() => onUpdateQuantity?.(item.productId, item.quantity + 1)}
                  disabled={item.stock !== undefined && item.quantity >= item.stock}
                  className="p-3 sm:p-2 hover:bg-primary-100 rounded-r-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Aumentar cantidad"
                >
                  <Plus className="w-5 h-5 sm:w-4 sm:h-4 text-primary-700" />
                </button>
              </div>
            )}

            <div className="text-right min-w-[90px] sm:min-w-[80px]">
              <p className="font-bold text-primary-900 text-lg sm:text-base">
                ${(item.price * item.quantity).toFixed(2)}
              </p>
            </div>

            {!readonly && (
              <button
                onClick={() => onRemove?.(item.productId)}
                className="p-3 sm:p-2 text-danger-500 hover:text-danger-700 hover:bg-danger-50 rounded-full transition-colors active:scale-95"
                title="Eliminar del carrito"
                aria-label="Eliminar producto"
              >
                <Trash2 className="w-5 h-5 sm:w-5 sm:h-5" />
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
