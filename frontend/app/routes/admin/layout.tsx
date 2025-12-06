import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from ".react-router/types/app/routes/admin/+types/layout";
import { userContext } from "~/common/context/user-context";
import { authMiddleware } from "~/common/middleware/auth-middleware";

export const middleware: Route.MiddlewareFunction[] = [
  authMiddleware,
];

export async function loader({ context }: Route.LoaderArgs) {
    const user = context.get(userContext);
    if (!user) {
        throw new Response("No tienes permisos de administrador", { status: 401 });
    }
    return { user };
}

export default function AdminLayoutRoute({ loaderData }: Route.ComponentProps) {
    const { user } = loaderData;
    console.log("layout user", user);
    return <AdminLayout user={user} />;
}
