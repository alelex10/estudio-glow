import { Link } from "react-router";
import clsx from "clsx";
import Drawer from "../Drawer";
import DrawerHeader from "../DrawerHeader";
import { Heart, ShoppingBag, LayoutDashboard, LogOut, User as UserIcon } from "lucide-react";
import { Form } from "react-router";
import type { User } from "../../types/user-types";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Productos" },
  { href: "/orders", label: "Mis Ordenes" },
];

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
}

export default function MobileDrawer({ isOpen, onClose, user }: MobileDrawerProps) {
  const isCustomer = user?.role === "customer";
  const isAdmin = user?.role === "admin";

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
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  to={link.href}
                  className="text-white text-lg font-medium hover:text-primary-200 transition-colors block py-3 px-4 rounded-lg hover:bg-white/10"
                  onClick={onClose}
                >
                  {link.label}
                </Link>
              </li>
            ))}
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
                        to="/favorites"
                        className="flex items-center gap-3 text-white text-lg font-medium hover:text-primary-200 transition-colors py-3 px-4 rounded-lg hover:bg-white/10"
                        onClick={onClose}
                      >
                        <Heart className="w-5 h-5" />
                        Favoritos
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/cart"
                        className="flex items-center gap-3 text-white text-lg font-medium hover:text-primary-200 transition-colors py-3 px-4 rounded-lg hover:bg-white/10 opacity-50 cursor-not-allowed"
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
                      to="/admin"
                      className="flex items-center gap-3 text-white text-lg font-medium hover:text-primary-200 transition-colors py-3 px-4 rounded-lg hover:bg-white/10"
                      onClick={onClose}
                    >
                      <LayoutDashboard className="w-5 h-5" />
                      Dashboard
                    </Link>
                  </li>
                )}
                
                <li>
                  <Form method="post" action="/actions/auth/logout">
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
                to="/auth/register"
                className="block text-center text-white font-medium border-2 border-primary-200 py-3 px-4 rounded-lg hover:bg-primary-200 hover:text-primary-900 transition-colors"
                onClick={onClose}
              >
                Registrarse
              </Link>
              <Link
                to="/login"
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
