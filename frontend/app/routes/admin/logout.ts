import { redirect } from "react-router";
import { contextProvider, userContext, tokenContext } from "~/common/context/context";
import { authService } from "~/common/services/authService";
import type { Route } from "./+types/logout";

export async function action({ request, }: Route.ActionArgs) {
  try {
    await authService.logout();

    contextProvider.set(userContext, null);
    contextProvider.set(tokenContext, null);

    return redirect("/auth/login");
  } catch (error) {
    contextProvider.set(userContext, null);
    contextProvider.set(tokenContext, null);
    return redirect("/auth/login");
  }
}