import { useState } from "react";
import { useNavigate } from "react-router";
import { categoryService } from "~/common/services/categoryService";
import { CategoryForm } from "~/common/components/admin/CategoryForm";
import { toast } from "~/common/components/Toast";
import type {
  CreateCategoryData,
  UpdateCategoryData,
} from "~/common/types/category-types";
import type { Route } from "./+types/category.new";
import { getToken } from "~/common/services/auth.server";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nueva Categoría | Admin Dashboard" },
    { name: "description", content: "Crear nueva categoría - Estudio Glow" },
  ];
}

export async function loader({ request }: Route.ActionArgs) {
  const token = await getToken(request);
  return { token };
}

export default function NewCategory({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (
    data: CreateCategoryData | UpdateCategoryData,
  ) => {
    const token = loaderData?.token;
    setIsLoading(true);
    try {
      await categoryService.createCategory(
        data as CreateCategoryData,
        token || undefined,
      );
      toast("success", "Categoría creada correctamente");
      navigate("/admin/categories");
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Error al crear categoría";
      toast("error", errorMessage);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    navigate("/admin/categories");
  };

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Nueva Categoría</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crea una nueva categoría para organizar tus productos
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <CategoryForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
