import { Link } from "react-router";
import clsx from "clsx";
import { Package, Image, ChevronRight } from "lucide-react";

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
  category: {
    id: number;
    name: string;
  };
}

interface RecentProductsProps {
  products: Product[];
}

export function RecentProducts({ products }: RecentProductsProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900">
          Productos Recientes
        </h2>
        <Link
          to="/admin/products"
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          Ver todos →
        </Link>
      </div>

      {products.length === 0 ? (
        <div className="p-12 text-center text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No hay productos aún</p>
          <Link
            to="/admin/products/new"
            className="inline-block mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Crear primer producto
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/admin/products/${product.id}`}
              className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
            >
              {/* Imagen */}
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Image className="w-6 h-6 text-gray-300" />
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {product.name}
                </p>
                <p className="text-sm text-gray-500">
                  {product.category.name}
                </p>
              </div>

              {/* Precio y stock */}
              <div className="text-right">
                <p className="font-semibold text-gray-900">
                  ${product.price.toFixed(2)}
                </p>
                <p
                  className={clsx(
                    "text-sm",
                    product.stock === 0
                      ? "text-red-500"
                      : product.stock <= 10
                        ? "text-amber-500"
                        : "text-green-500"
                  )}
                >
                  Stock: {product.stock}
                </p>
              </div>

              {/* Arrow */}
              <ChevronRight className="w-5 h-5 text-gray-400" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
