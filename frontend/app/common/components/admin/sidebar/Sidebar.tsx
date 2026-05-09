import { NavLink, useLocation, useSubmit } from "react-router";
import clsx from "clsx";
import DrawerHeader from "../../DrawerHeader";
import { Box, Home, LogOut, Tag, User } from "lucide-react";
import { SidebarItem } from "./SidebarItem";
import { ROUTES } from "~/common/constants/routes";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    name: "Dashboard",
    path: ROUTES.admin.BASE,
    icon: <Home />,
  },
  {
    name: "Productos",
    path: ROUTES.admin.PRODUCTS,
    icon: <Box />,
  },
  {
    name: "Categorías",
    path: ROUTES.admin.CATEGORIES,
    icon: <Tag />,
  },
  {
    name: "Cerrar Sesión",
    path: ROUTES.admin.BASE, // not a real route — handled by name check below
    icon: <LogOut />,
  },
  {
    name: "Pedidos",
    path: ROUTES.admin.ORDERS,
    icon: <Box />,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const submit = useSubmit();

  const handleLogout = async () => {
    onClose();
    try {
      submit(null, {
        action: ROUTES.actions.AUTH_LOGOUT,
        method: "post",
        navigate: false,
      });
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <>
      {/* Overlay móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={clsx(
          "fixed lg:static inset-y-0 left-0 z-50",
          "w-64 bg-linear-to-b from-gray-900 to-gray-800",
          "transform transition-transform duration-300 ease-in-out",
          "lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex flex-col h-full">
          <DrawerHeader
            title="Estudio Glow"
            subtitle="Panel Admin"
            onClose={onClose}
            borderColor="border-gray-700"
            subtitleColor="text-gray-400"
            closeButtonColor="lg:hidden text-gray-400 hover:text-white"
          />

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.path === ROUTES.admin.BASE
                  ? location.pathname === ROUTES.admin.BASE
                  : location.pathname.startsWith(item.path);

              const isLogout = item.name === "Cerrar Sesión";
              if (isLogout) {
                return (
                  <button
                    key={item.path}
                    onClick={handleLogout}
                    className="w-full cursor-pointer"
                  >
                    <SidebarItem isActive={isActive}>
                      {item.icon}
                      <span>{item.name}</span>
                    </SidebarItem>
                  </button>
                );
              }
              return (
                <NavLink key={item.path} onClick={onClose} to={item.path}>
                  <SidebarItem isActive={isActive}>
                    {item.icon}
                    <span>{item.name}</span>
                  </SidebarItem>
                </NavLink>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/50">
              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                <User className="w-4 h-4 text-primary-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">Admin</p>
                <p className="text-xs text-gray-400 truncate">Administrador</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
