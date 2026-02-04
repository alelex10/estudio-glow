import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import { authMiddleware } from "~/common/middleware/authMiddleware";
import { userContext, userContextProvider } from "~/common/context/context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Panel" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];
export async function loader() {
  const user = userContextProvider.get(userContext);
  return { user };
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AdminLayout user={loaderData?.user} />;
}
