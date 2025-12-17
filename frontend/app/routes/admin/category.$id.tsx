import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { categoryService } from "~/common/services/categoryService";
import { CategoryForm } from "~/common/components/admin/CategoryForm";
import { LoadingSpinner } from "~/common/components/admin/LoadingSpinner";
import { toast } from "~/common/components/admin/Toast";
import type {
    Category,
    UpdateCategoryData,
} from "~/common/types/category-types";
import type { Route } from "./+types/category.$id";

export function meta({ }: Route.MetaArgs) {
    return [
        { title: "Editar Categoría | Admin Dashboard" },
        { name: "description", content: "Editar categoría - Estudio Glow" },
    ];
}

export default function EditCategory() {
    const navigate = useNavigate();
    const params = useParams();
    const categoryId = params.id;

    const [category, setCategory] = useState<Category | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const loadCategory = async () => {
            if (!categoryId) {
                toast("error", "ID de categoría no válido");
                navigate("/admin/categories");
                return;
            }

            try {
                const data = await categoryService.getCategory(categoryId);
                setCategory(data);
            } catch (error) {
                toast("error", "Error al cargar categoría");
                console.error(error);
                navigate("/admin/categories");
            } finally {
                setIsLoading(false);
            }
        };

        loadCategory();
    }, [categoryId, navigate]);

    const handleSubmit = async (data: UpdateCategoryData) => {
        if (!categoryId) return;

        setIsSubmitting(true);
        try {
            await categoryService.updateCategory(categoryId, data);
            toast("success", "Categoría actualizada correctamente");
            navigate("/admin/categories");
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Error al actualizar categoría";
            toast("error", errorMessage);
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        navigate("/admin/categories");
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (!category) {
        return null;
    }

    return (
        <div className="max-w-2xl">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900">Editar Categoría</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Actualiza la información de la categoría
                </p>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <CategoryForm
                    mode="edit"
                    initialData={category}
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                    isLoading={isSubmitting}
                />
            </div>
        </div>
    );
}
