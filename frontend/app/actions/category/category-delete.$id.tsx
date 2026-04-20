import { requireAuth } from "~/common/actions/auth-helpers";
import { categoryService } from "~/common/services/categoryService";
import type { Route } from "./+types/category-delete.$id";

export async function action({ params, request }: Route.ActionArgs) {
  const token = await requireAuth(request);
  try {
    await categoryService.deleteCategory(params.id, token);
    return { success: true };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Error al eliminar categoría";
    return { success: false, error: errorMessage };
  }
}
