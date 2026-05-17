import { Outlet } from "react-router";
import Navbar from "~/common/components/nav-bar/Navbar";
import { getUser, getToken } from "~/common/services/auth.server";
import type { Route } from "./+types/layout";
import type { User } from "~/common/types/user-types";
import { CartProvider } from "~/common/context/CartContext";
import { ToastContainer } from "~/common/components/Toast";
import { FavoritesProvider } from "~/common/context/FavoritesContext";
import { favoriteService } from "~/common/services/favoriteService";

export interface LayoutLoaderData {
  user: User | null;
  favoriteIds: string[];
}

export async function loader({ request }: Route.LoaderArgs): Promise<LayoutLoaderData> {
  const user = await getUser(request);
  const token = await getToken(request);
  let favoriteIds: string[] = [];
  if (token) {
    try {
      const res = await favoriteService.getIds(token);
      favoriteIds = res.data;
    } catch {
      favoriteIds = [];
    }
  }
  return { user, favoriteIds };
}

export default function Layout({ loaderData }: Route.ComponentProps) {
    return (
        <FavoritesProvider serverFavoriteIds={loaderData.favoriteIds} isAuthenticated={!!loaderData.user}>
            <CartProvider isAuthenticated={!!loaderData?.user}>
                <div className="bg-primary-100" >
                    <Navbar />
                    <Outlet />
                    <ToastContainer />
                </div>
            </CartProvider>
        </FavoritesProvider>
    );
}
