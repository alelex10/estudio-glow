import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import {
  userContext,
  tokenContext,
  contextProvider,
} from "~/common/context/context";
import { redirect } from "react-router";
import type { MessageResponse } from "~/common/types/response";
import { API_ENDPOINTS } from "~/common/config/api-end-points";
import { apiClientTest } from "~/common/config/api-client-test";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Panel" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  try {
    const isAuthenticated = await apiClientTest<MessageResponse>(
      API_ENDPOINTS.AUTH.VERIFY,
      {
        method: "GET",
      },
      request,
    );


    if (!isAuthenticated || !isAuthenticated.user) {
      contextProvider.set(userContext, null);
      contextProvider.set(tokenContext, null);
      return redirect("/auth/login");
    }

    contextProvider.set(userContext, isAuthenticated.user);

    return { user: isAuthenticated.user };
  } catch (error) {
    contextProvider.set(userContext, null);
    contextProvider.set(tokenContext, null);
    return redirect("/auth/login");
  }
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AdminLayout user={loaderData?.user} />;
}
