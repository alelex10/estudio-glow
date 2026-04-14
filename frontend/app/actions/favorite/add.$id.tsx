import { requireAuth } from "~/common/actions/auth-helpers";
import type { Route } from "./+types/add.$id";
import { favoriteService } from "~/common/services/favoriteService";

export async function action({ params, request }: Route.ActionArgs) {
  const token = await requireAuth(request);
  await favoriteService.add(params.productId, token);
  return { success: true };
}
