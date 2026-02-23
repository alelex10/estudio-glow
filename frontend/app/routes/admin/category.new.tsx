import { useActionData, useNavigation, useSubmit } from "react-router";
import { categoryService } from "~/common/services/categoryService";
import { CategoryForm } from "~/common/components/admin/CategoryForm";
import type { Route } from "./+types/category.new";
import type {
  CreateCategoryFormData,
  UpdateCategoryFormData,
} from "~/common/schemas/categorySchema";
import { getToken } from "~/common/services/auth.server";
import { redirect } from "react-router";

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

export async function action({ request }: Route.ActionArgs) {
  const token = await getToken(request);
  const formData = await request.formData();

  try {
    // Extraer datos (sin validación duplicada - ya se hace con Zod en frontend)
    const rawData = {
      name: formData.get("name") as string,
      description: (formData.get("description") as string) || undefined,
    };

    // Crear categoría directamente
    await categoryService.createCategory(rawData, token || undefined);
    return redirect("/admin/categories");
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Error al crear categoría";
    return { errors: [errorMessage] };
  }
}

export default function NewCategory() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const isSubmitting = navigation.state === "submitting";

  const handleSubmit = (
    data: CreateCategoryFormData | UpdateCategoryFormData,
  ) => {
    submit(data, { method: "post" });
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
          isSubmitting={isSubmitting}
          errors={actionData?.errors}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
