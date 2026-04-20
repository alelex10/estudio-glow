import { useState, Suspense, useEffect } from "react";
import { Await, Link, redirect, useNavigate, useFetcher, useSearchParams } from "react-router";
import clsx from "clsx";
import { Image, Plus, SlidersHorizontal } from "lucide-react";
import { productService } from "~/common/services/productService";
import { categoryService } from "~/common/services/categoryService";
import { DataTable, ActionButton } from "~/common/components/data-table";
import { ConfirmModal } from "~/common/components/admin/ConfirmModal";
import { ProductsSkeleton } from "./components/ProductsSkeleton";
import { FilterDrawer } from "~/common/components/product-filter/FilterDrawer";
import { FilterSideBar } from "~/common/components/product-filter/FilterSideBar";
import type { ProductResponse, Category } from "~/common/types/product-types";
import type { Route } from "./+types/products";
import { requireAuth } from "~/common/actions/auth-helpers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Dashboard" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await requireAuth(request);

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q") || undefined;
  const category = url.searchParams.get("category") || undefined;
  const categoryId = url.searchParams.get("categoryId") || undefined;
  const stock = url.searchParams.get("stock") as "low" | "out" | "ok" | undefined;
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10));

  return {
    productsPaginated: Promise.all([
      productService.getProductsPaginated(
        page,
        limit,
        searchQuery,
        category,
        categoryId,
        stock
      ),
      categoryService.listCategories(),
    ]).then(([productsPaginated, categoriesResult]) => {
      const categories: Category[] = categoriesResult.data || [];
      return {
        productsPaginated,
        categories,
      };
    }),
    initialSearchQuery: searchQuery || "",
    initialPage: page,
    initialLimit: limit,
  };
}

export default function AdminProducts({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    product: ProductResponse | null;
  }>({
    isOpen: false,
    product: null,
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handlePageSizeChange = (limit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit.toString());
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleDelete = async () => {
    await fetcher.submit(
      {},
      {
        method: "post",
        action: `/actions/product/delete/${deleteModal.product?.id}`,
      },
    );

    setDeleteModal({ isOpen: false, product: null });
  };

  const columns = [
    {
      key: "image" as const,
      header: "Imagen",
      render: (product: ProductResponse) => (
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Image className="w-5 h-5 text-gray-300" />
            </div>
          )}
        </div>
      ),
    },
    {
      key: "name",
      header: "Nombre",
      render: (product: ProductResponse) => (
        <div>
          <p className="font-medium text-gray-900">{product.name}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {product.description}
          </p>
        </div>
      ),
    },
    {
      key: "category",
      header: "Categoría",
      render: (product: ProductResponse) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
          {product.category.name}
        </span>
      ),
    },
    {
      key: "price",
      header: "Precio",
      render: (product: ProductResponse) => (
        <span className="font-medium text-gray-900">
          ${product.price.toFixed(2)}
        </span>
      ),
    },
    {
      key: "stock",
      header: "Stock",
      render: (product: ProductResponse) => (
        <span
          className={clsx(
            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
            product.stock === 0
              ? "bg-red-100 text-red-800"
              : product.stock <= 10
                ? "bg-amber-100 text-amber-800"
                : "bg-green-100 text-green-800",
          )}
        >
          {product.stock}
        </span>
      ),
    },
  ];

  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <Await resolve={loaderData.productsPaginated}>
        {({ productsPaginated, categories }) => (
          <div className="flex gap-6">
            {/* Sidebar de filtros - Desktop */}
            <div className="hidden lg:block">
              <FilterSideBar categories={categories} />
            </div>

            {/* Contenido principal */}
            <div className="flex-1 space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-3">
                  {/* Botón de filtros - Mobile */}
                  <button
                    onClick={() => setIsFilterOpen(true)}
                    className="lg:hidden inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-all duration-200"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                    Filtros
                  </button>
                </div>

                <Link
                  to="/admin/products/new"
                  className={clsx(
                    "inline-flex items-center justify-center gap-2 px-4 py-2.5",
                    "bg-linear-to-r from-primary-500 to-primary-600 text-white",
                    "rounded-lg font-medium text-sm shrink-0",
                    "hover:from-primary-600 hover:to-primary-700",
                    "transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30",
                  )}
                >
                  <Plus className="w-5 h-5" />
                  Nuevo Producto
                </Link>
              </div>

              {/* Table */}
              <DataTable
                data={productsPaginated?.data || []}
                columns={columns}
                keyExtractor={(product) => product.id}
                emptyMessage="No se encontraron productos"
                onRowClick={(product) =>
                  navigate(`/admin/products/${product.id}`)
                }
                pagination={productsPaginated?.pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
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

              <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, product: null })}
                onConfirm={handleDelete}
                title="Eliminar producto"
                message={`¿Estás seguro de eliminar "${deleteModal.product?.name}"? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                variant="danger"
                isLoading={fetcher.state !== "idle"}
              />

              {/* Drawer de filtros - Mobile */}
              <FilterDrawer
                categories={categories}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
              />
            </div>
          </div>
        )}
      </Await>
    </Suspense>
  );
}
