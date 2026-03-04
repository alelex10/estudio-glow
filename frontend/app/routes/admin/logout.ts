import { authService } from "~/common/services/authService";
import { destroyAuthSession } from "~/common/services/auth.server";
import type { Route } from "./+types/logout";

export async function action({ request }: Route.ActionArgs) {
  try {
    await authService.logout();
  } catch {
  }

  return destroyAuthSession(request);
}