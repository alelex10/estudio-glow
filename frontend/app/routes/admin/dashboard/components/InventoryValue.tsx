import { DollarSign } from "lucide-react";

interface InventoryValueProps {
  totalValue?: number;
}

export function InventoryValue({ totalValue }: InventoryValueProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">
            Valor Total del Inventario
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-1">
            $
            {totalValue?.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            }) || "0.00"}
          </p>
        </div>
        <div className="p-4 bg-linear-to-br from-primary-400 via-primary-200 to-primary-400 rounded-xl">
          <DollarSign className="w-8 h-8 text-primary-600" />
        </div>
      </div>
    </div>
  );
}
