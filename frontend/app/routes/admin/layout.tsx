import type { LoaderFunctionArgs } from "react-router";
import { AdminLayout } from "~/common/components/admin/AdminLayout";
import { getUserContext } from "~/common/context";
import type { Route } from "./+types/layout";

export async function loader({context}:Route.LoaderArgs) {
    const user = getUserContext();
    return { user };
}

export default function AdminLayoutRoute({loaderData}: Route.ComponentProps) {
    return <AdminLayout user={loaderData?.user} />;
}
