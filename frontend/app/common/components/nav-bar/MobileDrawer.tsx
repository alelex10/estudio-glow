import { Link, useLocation } from "react-router";
import clsx from "clsx";
import Drawer from "../Drawer";
import DrawerHeader from "../DrawerHeader";
import { Heart, ShoppingBag, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Form } from "react-router";
import type { User } from "../../types/user-types";
import { ROUTES, NAV_LINKS } from "~/common/constants/routes";
import { useFavorites } from "~/common/context/FavoritesContext";

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

function isActiveLink(href: string, pathname: string): boolean {
  if (href === ROUTES.HOME) return pathname === ROUTES.HOME;
  return pathname.startsWith(href);
}

export default function MobileDrawer({ isOpen, onClose, user }: MobileDrawerProps) {
  const isCustomer = user?.role === "customer";
  const isAdmin = user?.role === "admin";
  const { favoriteCount } = useFavorites();
  const { pathname } = useLocation();

  return (
    <Drawer isOpen={isOpen} onClose={onClose} showCloseButton={false}>
      <div className="flex flex-col h-full">
        <DrawerHeader
          title="Estudio Glow"
          subtitle="Menú"
          onClose={onClose}
          borderColor="border-primary-700"
          subtitleColor="text-primary-300"
          closeButtonColor="text-primary-300 hover:text-white"
        />

        <nav className="flex-1 p-4">
          <h3 className="text-primary-300 text-sm font-semibold tracking-wider mb-4 uppercase">
            Navegación
          </h3>
          <ul className="space-y-2 mb-8">
            {NAV_LINKS.map((link) => {
              const active = isActiveLink(link.href, pathname);
              return (
                <li key={link.href}>
                  <Link
                    to={link.href}
                    className={clsx(
                      "block py-3 px-4 rounded-lg text-lg font-medium transition-all duration-200",
                      active
                        ? "bg-white/20 text-white font-semibold"
                        : "text-white hover:text-primary-200 hover:bg-white/10",
                    )}
                    onClick={onClose}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>

          {user && (
            <>
              <h3 className="text-primary-300 text-sm font-semibold tracking-wider mb-4 uppercase">
                Mi Cuenta
              </h3>
              <ul className="space-y-2 mb-8">
                <li className="flex items-center gap-3 py-3 px-4 rounded-lg bg-white/5">
                  <UserIcon className="w-5 h-5 text-primary-200" />
                  <span className="text-white font-medium">{user.name}</span>
                </li>
                
                {isCustomer && (
                  <>
                    <li>
                      <Link
                        to={ROUTES.FAVORITES}
                        className={clsx(
                          "flex items-center gap-3 text-lg font-medium transition-all duration-200 py-3 px-4 rounded-lg",
                          isActiveLink(ROUTES.FAVORITES, pathname)
                            ? "bg-white/20 text-white font-semibold"
                            : "text-white hover:text-primary-200 hover:bg-white/10",
                        )}
                        onClick={onClose}
                      >
                        <div className="relative">
                          <Heart className="w-5 h-5" />
                          {favoriteCount > 0 && (
                            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                              {favoriteCount}
                            </span>
                          )}
                        </div>
                        Favoritos
                      </Link>
                    </li>
                    <li>
                      <Link
                        to={ROUTES.CART}
                        className={clsx(
                          "flex items-center gap-3 text-lg font-medium transition-all duration-200 py-3 px-4 rounded-lg opacity-50 cursor-not-allowed",
                          isActiveLink(ROUTES.CART, pathname)
                            ? "bg-white/20 text-white font-semibold"
                            : "text-white hover:text-primary-200 hover:bg-white/10",
                        )}
                        onClick={onClose}
                        title="Próximamente"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        Carrito
                      </Link>
                    </li>
                  </>
                )}
                
                {isAdmin && (
                  <li>
                      <Link
                        to={ROUTES.admin.BASE}
                        className={clsx(
                          "flex items-center gap-3 text-lg font-medium transition-all duration-200 py-3 px-4 rounded-lg",
                          isActiveLink(ROUTES.admin.BASE, pathname)
                            ? "bg-white/20 text-white font-semibold"
                            : "text-white hover:text-primary-200 hover:bg-white/10",
                        )}
                        onClick={onClose}
                      >
                        <LayoutDashboard className="w-5 h-5" />
                        Dashboard
                      </Link>
                  </li>
                )}
                
                <li>
                  <Form method="post" action={ROUTES.actions.AUTH_LOGOUT}>
                    <button
                      type="submit"
                      className="flex items-center gap-3 text-white text-lg font-medium hover:text-primary-200 transition-colors w-full py-3 px-4 rounded-lg hover:bg-white/10"
                    >
                      <LogOut className="w-5 h-5" />
                      Cerrar Sesión
                    </button>
                  </Form>
                </li>
              </ul>
            </>
          )}

          {!user && (
            <div className="space-y-3">
              <Link
                to={ROUTES.REGISTER}
                className="block text-center text-white font-medium border-2 border-primary-200 py-3 px-4 rounded-lg hover:bg-primary-200 hover:text-primary-900 transition-colors"
                onClick={onClose}
              >
                Registrarse
              </Link>
              <Link
                to={ROUTES.LOGIN}
                className="block text-center text-primary-900 font-medium bg-primary-200 py-3 px-4 rounded-lg hover:bg-primary-300 transition-colors"
                onClick={onClose}
              >
                Iniciar Sesión
              </Link>
            </div>
          )}
        </nav>
      </div>
    </Drawer>
  );
}
