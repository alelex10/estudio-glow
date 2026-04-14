import { requireAuth } from "~/common/actions/auth-helpers";
import type { Route } from "./+types/product-delete.$id";
import { productService } from "~/common/services/productService";

export async function action({ params, request }: Route.ActionArgs) {
  const token = await requireAuth(request);
  await productService.deleteProduct(params.id, token);
  return { success: true };
}
