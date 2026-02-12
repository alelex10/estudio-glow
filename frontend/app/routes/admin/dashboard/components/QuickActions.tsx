import { Link } from "react-router";
import clsx from "clsx";
import { Plus, List } from "lucide-react";

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Link
        to="/admin/products/new"
        className={clsx(
          "flex items-center gap-4 p-6 rounded-xl",
          "bg-linear-to-br from-primary-500 to-primary-600",
          "text-white",
          "hover:from-primary-600 hover:to-primary-700",
          "transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30"
        )}
      >
        <div className="p-3 bg-white/20 rounded-xl">
          <Plus className="w-6 h-6" />
        </div>
        <div>
          <p className="font-semibold">Agregar Producto</p>
          <p className="text-sm text-white/80">
            Añadir nuevo item al catálogo
          </p>
        </div>
      </Link>

      <Link
        to="/admin/products"
        className={clsx(
          "flex items-center gap-4 p-6 rounded-xl",
          "bg-white border border-gray-200",
          "hover:border-primary-300 hover:shadow-lg",
          "transition-all duration-200"
        )}
      >
        <div className="p-3 bg-gray-100 rounded-xl">
          <List className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="font-semibold text-gray-900">Ver Catálogo</p>
          <p className="text-sm text-gray-500">
            Gestionar productos existentes
          </p>
        </div>
      </Link>
    </div>
  );
}
