import { destroyAuthSession } from "~/common/services/auth.server";
import type { Route } from "./+types/logout";
import { logout } from "~/common/services/authApi.server";

export async function action({ request }: Route.ActionArgs) {
  try {
    await logout();
  } catch {}

  return destroyAuthSession(request);
}
