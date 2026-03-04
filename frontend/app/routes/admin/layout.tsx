import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import { redirect } from "react-router";
import type { MessageResponse } from "~/common/types/response";
import { API_ENDPOINTS } from "~/common/config/api-end-points";
import { getToken } from "~/common/services/auth.server";
import { getSession } from "~/common/services/session-storage";
import { apiClient } from "~/common/config/api-client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Panel" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = await getToken(request);

  if (!token) {
    return redirect("/auth/login");
  }

  try {
    const data = await apiClient<MessageResponse>({
      endpoint: API_ENDPOINTS.AUTH.VERIFY,
      options: {
        method: "GET",
      },
      token,
    });

    if (!data || !data.user) {
      return redirect("/auth/login");
    }

    const session = await getSession(request.headers.get("Cookie"));
    return { user: session.get("user") };
  } catch (error) {
    return redirect("/auth/login");
  }
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AdminLayout user={loaderData?.user} />;
}
