import { Outlet } from "react-router";
import Navbar from "~/common/components/nav-bar/Navbar";
import { getUser } from "~/common/services/auth.server";
import type { Route } from "./+types/layout";
import type { User } from "~/common/types/user-types";

export interface LayoutLoaderData {
  user: User | null;
}

export async function loader({ request }: Route.LoaderArgs): Promise<LayoutLoaderData> {
  const user = await getUser(request);
  return { user };
}

export default function Layout() {
    return (
        <div className="bg-primary-100" >
            <Navbar />
            <Outlet />
        </div>
    );
}