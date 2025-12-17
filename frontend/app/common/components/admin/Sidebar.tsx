import { NavLink, useLocation } from "react-router";
import clsx from "clsx";
import { Logo } from "../Logo";
import { Box, Home, Tag } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const navItems = [
    {
        name: "Dashboard",
        path: "/admin",
        icon: (
            <Home />
        ),
    },
    {
        name: "Productos",
        path: "/admin/products",
        icon: (
            <Box />
        ),
    },
    {
        name: "Categorías",
        path: "/admin/categories",
        icon: (
            <Tag />
        ),
    },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const location = useLocation();

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
                    "w-64 bg-gradient-to-b from-gray-900 to-gray-800",
                    "transform transition-transform duration-300 ease-in-out",
                    "lg:translate-x-0",
                    isOpen ? "translate-x-0" : "-translate-x-full"
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
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Navegación */}
                    <nav className="flex-1 p-4 space-y-1">
                        {navItems.map((item) => {
                            const isActive =
                                item.path === "/admin"
                                    ? location.pathname === "/admin"
                                    : location.pathname.startsWith(item.path);

                            return (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    onClick={onClose}
                                    className={clsx(
                                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                                        isActive
                                            ? "bg-primary-500/20 text-primary-400 font-medium"
                                            : "text-gray-400 hover:bg-gray-700/50 hover:text-white"
                                    )}
                                >
                                    {item.icon}
                                    <span>{item.name}</span>
                                    {isActive && (
                                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
                                    )}
                                </NavLink>
                            );
                        })}
                    </nav>

                    {/* Footer */}
                    <div className="p-4 border-t border-gray-700">
                        <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-800/50">
                            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center">
                                <svg className="w-4 h-4 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
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
