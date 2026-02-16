import { redirect } from "react-router";
import { contextProvider, userContext } from "~/common/context/context";
import { authService } from "~/common/services/authService";

export async function action({ request }: { request: Request }) {
  try {
    await authService.logout();

    contextProvider.set(userContext, null);

    return redirect("/admin/login");
  } catch (error) {
    contextProvider.set(userContext, null);
    return redirect("/admin/login");
  }
}