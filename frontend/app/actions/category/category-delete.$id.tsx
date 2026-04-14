import { requireAuth } from "~/common/actions/auth-helpers";
import type { Route } from "../+types/category-delete.$id";
import { categoryService } from "~/common/services/categoryService";

export async function action({ params, request }: Route.ActionArgs) {
  const token = await requireAuth(request);
  await categoryService.deleteCategory(params.id, token);
  return { success: true };
}
