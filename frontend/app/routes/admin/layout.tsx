import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import { userContext, tokenContext, contextProvider } from "~/common/context/context";
import { redirect } from "react-router";
import { authService } from "~/common/services/authService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Panel" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  // Extraer token de las cookies y guardarlo en el contexto
  const cookieHeader = request.headers.get("Cookie");
  if (cookieHeader) {
    const tokenMatch = cookieHeader.match(/token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    if (token) {
      contextProvider.set(tokenContext, token);
    }
  }
  
  try {
    const response = await authService.isAuthenticated();
    
    if (!response || !response.user) {
      contextProvider.set(userContext, null);
      contextProvider.set(tokenContext, null);
      return redirect("/auth/login");
    }
    
    contextProvider.set(userContext, response.user);
    
    return { user: response.user };
  } catch (error) {
    contextProvider.set(userContext, null);
    contextProvider.set(tokenContext, null);
    return redirect("/auth/login");
  }
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
  return <AdminLayout user={loaderData?.user} />;
}
