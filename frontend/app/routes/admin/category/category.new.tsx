import { useActionData, useNavigation, useSubmit, useNavigate } from "react-router";
import { useEffect } from "react";
import { categoryService } from "~/common/services/categoryService";
import { CategoryForm } from "~/common/components/admin/CategoryForm";
import { toast } from "~/common/components/Toast";
import type { Route } from "./+types/category.new";
import type {
  CreateCategoryFormData,
  UpdateCategoryFormData,
} from "~/common/schemas/categorySchema";
import { requireAuth } from "~/common/actions/auth-helpers";
import { parseFormData } from "~/common/actions/form-helpers";
import { handleActionError } from "~/common/actions/error-helpers";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Nueva Categoría | Admin Dashboard" },
    { name: "description", content: "Crear nueva categoría - Estudio Glow" },
  ];
}

export async function loader({ request }: Route.ActionArgs) {
  const token = await requireAuth(request);
  return { token };
}

interface CategoryFormData {
  name: string;
  description: string | undefined;
}

interface ActionSuccess {
  success: true;
}

interface ActionError {
  success: false;
  errors: string[];
}

type ActionData = ActionSuccess | ActionError;

function isActionError(data: ActionData): data is ActionError {
  return data.success === false;
}

export async function action({ request }: Route.ActionArgs): Promise<ActionData> {
  try {
    const token = await requireAuth(request);
    const formData = await request.formData();

    const data = parseFormData<CategoryFormData>(formData, {
      name: (v) => String(v),
      description: (v) => v ? String(v) : undefined,
    });

    await categoryService.createCategory(data, token);
    return { success: true };
  } catch (error) {
    return handleActionError(error);
  }
}

export default function NewCategory() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const submit = useSubmit();
  const navigate = useNavigate();
  const isSubmitting = navigation.state === "submitting";

  // Show toast and navigate on success
  useEffect(() => {
    if (actionData?.success) {
      toast("success", "Categoría creada correctamente");
      navigate("/admin/categories");
    }
    if (actionData && isActionError(actionData)) {
      actionData.errors.forEach((error) => toast("error", error));
    }
  }, [actionData, navigate]);

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
          errors={actionData && isActionError(actionData) ? actionData.errors : undefined}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
