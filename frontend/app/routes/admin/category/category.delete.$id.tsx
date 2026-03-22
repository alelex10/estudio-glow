import { getToken } from "~/common/services/auth.server";
import type { Route } from "./+types/category.delete.$id";
import { categoryService } from "~/common/services/categoryService";

export async function action({ params, request }: Route.ActionArgs) {
  const token = await getToken(request);
  if (!token) {
    throw new Error("Authentication required");
  }
  await categoryService.deleteCategory(params.id, token);
  return { success: true };
}
