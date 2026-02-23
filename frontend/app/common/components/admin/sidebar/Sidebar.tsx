import { NavLink, useLocation, useSubmit } from "react-router";
import clsx from "clsx";
import { Logo } from "../../Logo";
import { Box, Home, LogOut, Tag, X, User } from "lucide-react";
import { authService } from "~/common/services/authService";
import { SidebarItem } from "./SidebarItem";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  {
    name: "Dashboard",
    path: "/admin",
    icon: <Home />,
  },
  {
    name: "Productos",
    path: "/admin/products",
    icon: <Box />,
  },
  {
    name: "Categorías",
    path: "/admin/categories",
    icon: <Tag />,
  },
  {
    name: "Cerrar Sesión",
    path: "/admin/logout",
    icon: <LogOut />,
  },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const submit = useSubmit();

  const handleLogout = async () => {
    onClose();
    try {
      submit(null, {
        action: "/admin/logout",
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
          {/* Logo */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center gap-3">
              <Logo variant="icon" className="w-10 h-10" />
              <div>
                <h1 className="text-white font-bold text-lg">Estudio Glow</h1>
                <span className="text-xs text-gray-400">Panel Admin</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navegación */}
          <nav className="flex-1 p-4 space-y-1">
            {navItems.map((item) => {
              const isActive =
                item.path === "/admin"
                  ? location.pathname === "/admin"
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
