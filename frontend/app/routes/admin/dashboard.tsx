import { useEffect, useState } from "react";
import { Link } from "react-router";
import clsx from "clsx";
import { productService } from "~/common/services/productService";
import { StatCard } from "~/common/components/admin/StatCard";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import type { Product } from "~/common/types";

interface Stats {
    total: number;
    lowStock: number;
    outOfStock: number;
    categories: number;
    totalValue: number;
}



export default function AdminDashboard() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [recentProducts, setRecentProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDashboardData = async () => {
            try {
                const [statsData, products] = await Promise.all([
                    productService.getProductStats(),
                    productService.getProducts(),
                ]);

                setStats(statsData);
                // Últimos 5 productos
                setRecentProducts(products.slice(-5).reverse());
            } catch (error) {
                console.error("Error loading dashboard data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadDashboardData();
    }, []);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <StatCard
                    title="Total Productos"
                    value={stats?.total || 0}
                    variant="primary"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    }
                />

                <StatCard
                    title="Stock Bajo"
                    value={stats?.lowStock || 0}
                    variant="warning"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                />

                <StatCard
                    title="Sin Stock"
                    value={stats?.outOfStock || 0}
                    variant="danger"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    }
                />

                <StatCard
                    title="Categorías"
                    value={stats?.categories || 0}
                    variant="success"
                    icon={
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                    }
                />
            </div>

            {/* Valor total del inventario */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500 font-medium">Valor Total del Inventario</p>
                        <p className="text-3xl font-bold text-gray-900 mt-1">
                            ${stats?.totalValue.toLocaleString("es-AR", { minimumFractionDigits: 2 }) || "0.00"}
                        </p>
                    </div>
                    <div className="p-4 bg-gradient-to-br from-primary-100 to-primary-200 rounded-xl">
                        <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
            </div>

            {/* Productos recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-lg font-semibold text-gray-900">Productos Recientes</h2>
                    <Link
                        to="/admin/products"
                        className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                    >
                        Ver todos →
                    </Link>
                </div>

                {recentProducts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
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
                        {recentProducts.map((product) => (
                            <Link
                                key={product.id}
                                to={`/admin/products/${product.id}`}
                                className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                            >
                                {/* Imagen */}
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                                    {product.imageUrl ? (
                                        <img
                                            src={product.imageUrl}
                                            alt={product.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-gray-900 truncate">{product.name}</p>
                                    <p className="text-sm text-gray-500">{product.category}</p>
                                </div>

                                {/* Precio y stock */}
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900">${product.price.toFixed(2)}</p>
                                    <p className={clsx(
                                        "text-sm",
                                        product.stock === 0 ? "text-red-500" :
                                            product.stock <= 10 ? "text-amber-500" : "text-green-500"
                                    )}>
                                        Stock: {product.stock}
                                    </p>
                                </div>

                                {/* Arrow */}
                                <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    to="/admin/products/new"
                    className={clsx(
                        "flex items-center gap-4 p-6 rounded-xl",
                        "bg-gradient-to-br from-primary-500 to-primary-600",
                        "text-white",
                        "hover:from-primary-600 hover:to-primary-700",
                        "transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30"
                    )}
                >
                    <div className="p-3 bg-white/20 rounded-xl">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold">Agregar Producto</p>
                        <p className="text-sm text-white/80">Añadir nuevo item al catálogo</p>
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
                        <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                        </svg>
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900">Ver Catálogo</p>
                        <p className="text-sm text-gray-500">Gestionar productos existentes</p>
                    </div>
                </Link>
            </div>
        </div>
    );
}
