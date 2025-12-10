import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import clsx from "clsx";
import { productService } from "~/common/services/productService";
import { DataTable, ActionButton } from "~/common/components/admin/DataTable";
import { SearchInput } from "~/common/components/admin/SearchInput";
import { ConfirmModal } from "~/common/components/admin/ConfirmModal";
import { toast } from "~/common/components/admin/Toast";
import type { Product } from "~/common/types/product-types";

export default function AdminProducts() {
    const navigate = useNavigate();
    const [products, setProducts] = useState<Product[]>([]);
    const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; product: Product | null }>({
        isOpen: false,
        product: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const loadProducts = useCallback(async () => {
        try {
            const data = await productService.getProductsPaginated(1, 10);
            setProducts(data.data);
            setFilteredProducts(data.data);
        } catch (error) {
            toast("error", "Error al cargar productos");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    // Filtrar productos
    useEffect(() => {
        if (!searchQuery) {
            setFilteredProducts(products);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredProducts(
                products.filter(
                    (p) =>
                        p.name.toLowerCase().includes(query) ||
                        p.category.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, products]);

    const handleDelete = async () => {
        if (!deleteModal.product) return;

        setIsDeleting(true);
        try {
            await productService.deleteProduct(deleteModal.product.id);
            toast("success", "Producto eliminado correctamente");
            setDeleteModal({ isOpen: false, product: null });
            loadProducts();
        } catch (error) {
            toast("error", "Error al eliminar producto");
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const columns = [
        {
            key: "image" as const,
            header: "Imagen",
            render: (product: Product) => (
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
                    {product.imageUrl ? (
                        <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    )}
                </div>
            ),
        },
        {
            key: "name",
            header: "Nombre",
            render: (product: Product) => (
                <div>
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">{product.description}</p>
                </div>
            ),
        },
        {
            key: "category",
            header: "Categoría",
            render: (product: Product) => (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                    {product.category}
                </span>
            ),
        },
        {
            key: "price",
            header: "Precio",
            render: (product: Product) => (
                <span className="font-medium text-gray-900">${product.price.toFixed(2)}</span>
            ),
        },
        {
            key: "stock",
            header: "Stock",
            render: (product: Product) => (
                <span
                    className={clsx(
                        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                        product.stock === 0
                            ? "bg-red-100 text-red-800"
                            : product.stock <= 10
                                ? "bg-amber-100 text-amber-800"
                                : "bg-green-100 text-green-800"
                    )}
                >
                    {product.stock}
                </span>
            ),
        },
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <SearchInput
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder="Buscar por nombre o categoría..."
                    className="w-full sm:max-w-xs"
                />

                <Link
                    to="/admin/products/new"
                    className={clsx(
                        "inline-flex items-center justify-center gap-2 px-4 py-2.5",
                        "bg-gradient-to-r from-primary-500 to-primary-600 text-white",
                        "rounded-lg font-medium text-sm",
                        "hover:from-primary-600 hover:to-primary-700",
                        "transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30"
                    )}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo Producto
                </Link>
            </div>

            {/* Table */}
            <DataTable
                data={filteredProducts}
                columns={columns}
                keyExtractor={(product) => product.id}
                isLoading={isLoading}
                emptyMessage="No se encontraron productos"
                onRowClick={(product) => navigate(`/admin/products/${product.id}`)}
                actions={(product) => (
                    <>
                        <ActionButton
                            variant="edit"
                            onClick={() => navigate(`/admin/products/${product.id}`)}
                        />
                        <ActionButton
                            variant="delete"
                            onClick={() => setDeleteModal({ isOpen: true, product })}
                        />
                    </>
                )}
            />

            {/* Delete confirmation modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, product: null })}
                onConfirm={handleDelete}
                title="Eliminar producto"
                message={`¿Estás seguro de eliminar "${deleteModal.product?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
