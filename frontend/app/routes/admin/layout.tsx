import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import { userContext, contextProvider } from "~/common/context/context";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Panel" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader() {
  const user = contextProvider.get(userContext);
  return { user };
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AdminLayout user={loaderData?.user} />;
}
