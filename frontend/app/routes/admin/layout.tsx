import { redirect } from "react-router";
import { AdminLayout } from "~/common/components/admin/AdminLayout";
import type { Route } from "./+types/layout";
import { authService } from "~/common/services/authService";
import { userContextProvider, userContext } from "~/common/context";
import { authMiddleware } from "~/common/middleware/authMiddleware";

export const middleware: Route.MiddlewareFunction[] = [
    authMiddleware,
];
export async function loader() {
    const user = userContextProvider.get(userContext);
    return { user };
}

export default function AdminLayoutRoute({loaderData}: Route.ComponentProps) {

    return <AdminLayout user={loaderData?.user} />;
}
