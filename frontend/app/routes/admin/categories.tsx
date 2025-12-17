import { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import clsx from "clsx";
import { categoryService } from "~/common/services/categoryService";
import { DataTable, ActionButton } from "~/common/components/admin/DataTable";
import { SearchInput } from "~/common/components/admin/SearchInput";
import { ConfirmModal } from "~/common/components/admin/ConfirmModal";
import { toast } from "~/common/components/admin/Toast";
import type { Category } from "~/common/types/category-types";
import type { Route } from "./+types/categories";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Categorías | Admin Dashboard" },
        { name: "description", content: "Gestión de categorías - Estudio Glow" },
    ];
}

export default function AdminCategories() {
    const navigate = useNavigate();
    const [categories, setCategories] = useState<Category[]>([]);
    const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [deleteModal, setDeleteModal] = useState<{
        isOpen: boolean;
        category: Category | null;
    }>({
        isOpen: false,
        category: null,
    });
    const [isDeleting, setIsDeleting] = useState(false);

    const loadCategories = useCallback(async () => {
        try {
            const response = await categoryService.listCategories();
            const data = response.data || [];
            setCategories(data);
            setFilteredCategories(data);
        } catch (error) {
            toast("error", "Error al cargar categorías");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadCategories();
    }, [loadCategories]);

    // Filtrar categorías
    useEffect(() => {
        if (!searchQuery) {
            setFilteredCategories(categories);
        } else {
            const query = searchQuery.toLowerCase();
            setFilteredCategories(
                categories.filter(
                    (c) =>
                        c.name.toLowerCase().includes(query) ||
                        c.description?.toLowerCase().includes(query)
                )
            );
        }
    }, [searchQuery, categories]);

    const handleDelete = async () => {
        if (!deleteModal.category) return;

        setIsDeleting(true);
        try {
            await categoryService.deleteCategory(deleteModal.category.id);
            toast("success", "Categoría eliminada correctamente");
            setDeleteModal({ isOpen: false, category: null });
            loadCategories();
        } catch (error) {
            const errorMessage =
                error instanceof Error ? error.message : "Error al eliminar categoría";
            toast("error", errorMessage);
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

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
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4v16m8-8H4"
                        />
                    </svg>
                    Nueva Categoría
                </Link>
            </div>

            {/* Búsqueda */}
            <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Buscar por nombre o descripción..."
                className="w-full sm:max-w-md"
            />

            {/* Table */}
            <DataTable
                data={filteredCategories}
                columns={columns}
                keyExtractor={(category) => category.id}
                isLoading={isLoading}
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

            {/* Delete confirmation modal */}
            <ConfirmModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, category: null })}
                onConfirm={handleDelete}
                title="Eliminar categoría"
                message={`¿Estás seguro de eliminar "${deleteModal.category?.name}"? Esta acción no se puede deshacer. Si la categoría tiene productos asociados, no se podrá eliminar.`}
                confirmText="Eliminar"
                variant="danger"
                isLoading={isDeleting}
            />
        </div>
    );
}
