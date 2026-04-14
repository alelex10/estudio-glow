import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import { redirect } from "react-router";
import type { MessageResponse } from "~/common/types/response";
import { API_ENDPOINTS } from "~/common/config/api-end-points";
import { requireAuth } from "~/common/actions/auth-helpers";
import { getSession, destroySession } from "~/common/services/session-storage";
import { apiClient } from "~/common/config/api-client";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin Dashboard | Glow Studio" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request, context }: Route.LoaderArgs) {
  const token = await requireAuth(request);

  try {
    const data = await apiClient<MessageResponse>({
      endpoint: API_ENDPOINTS.AUTH.VERIFY,
      options: {
        method: "GET",
      },
      token,
    });

    if (!data || !data.user) {
      return redirect("/login");
    }

    const session = await getSession(request.headers.get("Cookie"));
    return { user: session.get("user") };
  } catch (error) {
    const session = await getSession(request.headers.get("Cookie"));
    return redirect("/login", {
      headers: {
        "Set-Cookie": await destroySession(session),
      },
    });
  }
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AdminLayout user={loaderData?.user} />;
}
