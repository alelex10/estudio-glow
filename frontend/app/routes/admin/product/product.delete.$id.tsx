import { getToken } from "~/common/services/auth.server";
import type { Route } from "./+types/product.delete.$id";
import { productService } from "~/common/services/productService";

export async function action({ params, request }: Route.ActionArgs) {
  const token = await getToken(request);
  if (!token) {
    throw new Error("Authentication required");
  }
  await productService.deleteProduct(params.id, token);
  return { success: true };
}
