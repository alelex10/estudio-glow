import { Suspense, useEffect, useState } from "react";
import { Await, Link, useFetcher, useNavigate, redirect } from "react-router";
import clsx from "clsx";
import { Plus } from "lucide-react";
import { categoryService } from "~/common/services/categoryService";
import { DataTable } from "~/common/components/admin/data-table/DataTable";
import { ActionButton } from "~/common/components/admin/data-table/ActionButton";
import { SearchInput } from "~/common/components/admin/SearchInput";
import { ConfirmModal } from "~/common/components/admin/ConfirmModal";
import { toast } from "~/common/components/Toast";
import { CategoriesSkeleton } from "./components/CategoriesSkeleton";
import type { Category } from "~/common/types/category-types";
import type { Route } from "./+types/categories";
import { requireAuth } from "~/common/actions/auth-helpers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Categorías | Admin Dashboard" },
    { name: "description", content: "Gestión de categorías - Estudio Glow" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await requireAuth(request);

  const url = new URL(request.url);
  const searchQuery = url.searchParams.get("q") || undefined;

  return {
    categories: categoryService.listCategories(searchQuery),
    initialSearchQuery: searchQuery || "",
  };
}

export default function AdminCategories({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    category: Category | null;
  }>({
    isOpen: false,
    category: null,
  });

  const handleDelete = async () => {
    await fetcher.submit(
      {},
      {
        method: "post",
        action: `/actions/category/delete/${deleteModal.category?.id}`,
      },
    );

    setDeleteModal({ isOpen: false, category: null });
  };

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data) {
      if (fetcher.data.success) {
        toast("success", "Categoría eliminada correctamente");
      } else {
        const errorMessage = fetcher.data.error || "Error al eliminar categoría";
        toast("error", errorMessage);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const columns = [
    {
      key: "name",
      header: "Nombre",
      render: (category: Category) => (
        <div>
          <p className="font-medium text-gray-900">{category.name}</p>
          {category.description && (
            <p className="text-sm text-gray-500 truncate max-w-xs">
              {category.description}
            </p>
          )}
        </div>
      ),
    },
    {
      key: "createdAt",
      header: "Fecha de creación",
      render: (category: Category) => (
        <span className="text-sm text-gray-600">
          {new Date(category.createdAt).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
    {
      key: "updatedAt",
      header: "Última actualización",
      render: (category: Category) => (
        <span className="text-sm text-gray-600">
          {new Date(category.updatedAt).toLocaleDateString("es-AR", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
      ),
    },
  ];

  return (
    <Suspense fallback={<CategoriesSkeleton />}>
      <Await resolve={loaderData.categories}>
        {(categoriesResponse) => {
          const categories = categoriesResponse?.data || [];

          return (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Categorías</h1>
                  <p className="text-sm text-gray-500 mt-1">
                    Gestiona las categorías de productos
                  </p>
                </div>

                <Link
                  to="/admin/categories/new"
                  className={clsx(
                    "inline-flex items-center justify-center gap-2 px-4 py-2.5",
                    "bg-gradient-to-r from-primary-500 to-primary-600 text-white",
                    "rounded-lg font-medium text-sm",
                    "hover:from-primary-600 hover:to-primary-700",
                    "transition-all duration-200 hover:shadow-lg hover:shadow-primary-500/30"
                  )}
                >
                  <Plus className="w-5 h-5" />
                  Nueva Categoría
                </Link>
              </div>

              {/* Búsqueda */}
              <SearchInput
                paramName="q"
                placeholder="Buscar por nombre..."
                className="w-full sm:max-w-md"
              />

              {/* Table */}
              <DataTable
                data={categories}
                columns={columns}
                keyExtractor={(category) => category.id}
                emptyMessage="No se encontraron categorías"
                onRowClick={(category) => navigate(`/admin/categories/${category.id}`)}
                actions={(category) => (
                  <>
                    <ActionButton
                      variant="edit"
                      onClick={() => navigate(`/admin/categories/${category.id}`)}
                    />
                    <ActionButton
                      variant="delete"
                      onClick={() => setDeleteModal({ isOpen: true, category })}
                    />
                  </>
                )}
              />

              <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, category: null })}
                onConfirm={handleDelete}
                title="Eliminar categoría"
                message={`¿Estás seguro de eliminar "${deleteModal.category?.name}"? Esta acción no se puede deshacer. Si la categoría tiene productos asociados, no se podrá eliminar.`}
                confirmText="Eliminar"
                variant="danger"
                isLoading={fetcher.state !== "idle"}
              />
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}
