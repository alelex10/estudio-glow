import { Receipt, RefreshCw } from "lucide-react";

interface OrdersHeaderProps {
  pendingCount: number;
  isLoading: boolean;
  onRefresh: () => void;
}

export function OrdersHeader({ pendingCount, isLoading, onRefresh }: OrdersHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
      <div className="flex-1">
        <h1 className="text-xl sm:text-2xl font-bold bg-linear-to-r from-primary-600 to-primary-800 bg-clip-text text-transparent">Órdenes y Pagos</h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">Gestión de ventas y verificación de transferencias</p>
      </div>
      <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
        {pendingCount > 0 && (
          <span className="flex items-center gap-1.5 bg-linear-to-r from-amber-500 to-orange-500 text-white text-xs sm:text-sm font-medium px-3 py-2 sm:py-1.5 rounded-full shadow-md shadow-amber-500/20">
            <Receipt className="w-4 h-4" />
            {pendingCount} para verificar
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="flex items-center gap-2 text-xs sm:text-sm text-primary-600 hover:text-primary-800 border border-primary-200 rounded-lg px-3 py-2 sm:py-1.5 hover:bg-primary-50 transition-colors disabled:opacity-50 active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </button>
      </div>
    </div>
  );
}
