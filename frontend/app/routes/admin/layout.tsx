import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import { contextProvider, userContext } from "~/common/context/context";
import { authMiddleware } from "~/common/middleware/authMiddleware";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Panel" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export const middleware: Route.MiddlewareFunction[] = [authMiddleware];
export async function loader() {
  const user = contextProvider.get(userContext);
  return { user };
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AdminLayout user={loaderData?.user} />;
}
