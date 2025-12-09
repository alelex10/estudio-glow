import { useState } from "react";
import { Outlet, useLocation } from "react-router";
import clsx from "clsx";
import { Sidebar } from "./Sidebar";
import { AdminHeader } from "./AdminHeader";
import { ToastContainer } from "./Toast";
import type { User } from "~/common/types/response";

// Mapeo de rutas a títulos
const pageTitles: Record<string, { title: string; subtitle?: string }> = {
    "/admin": { title: "Dashboard", subtitle: "Resumen general" },
    "/admin/products": { title: "Productos", subtitle: "Gestiona tu catálogo" },
    "/admin/products/new": { title: "Nuevo Producto", subtitle: "Agregar al catálogo" },
};

export function AdminLayout({ user }: { user: User | null }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const location = useLocation();

    // Obtener título basado en la ruta
    const getPageInfo = () => {
        // Verificar rutas exactas primero
        if (pageTitles[location.pathname]) {
            return pageTitles[location.pathname];
        }
        // Verificar ruta de editar producto
        if (location.pathname.match(/^\/admin\/products\/\d+$/)) {
            return { title: "Editar Producto", subtitle: "Modificar datos del producto" };
        }
        return { title: "Admin", subtitle: undefined };
    };

    const pageInfo = getPageInfo();

    return (
        <div className={clsx("min-h-screen bg-gray-50",
            "md:flex"
        )}>
            {/* Sidebar */}
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main content */}
            <div className="min-h-screen flex flex-col md:m-auto">
                {/* Header */}
                <AdminHeader
                    user={user}
                    title={pageInfo.title}
                    subtitle={pageInfo.subtitle}
                    onMenuClick={() => setSidebarOpen(true)}
                />

                {/* Page content */}
                <main className="flex-1 p-4 lg:p-8">
                    <Outlet />
                </main>

                {/* Footer */}
                <footer className="py-4 px-8 border-t border-gray-100 bg-white/50">
                    <p className="text-sm text-gray-500 text-center">
                        © {new Date().getFullYear()} Estudio Glow. Panel de Administración.
                    </p>
                </footer>
            </div>

            {/* Toast notifications */}
            <ToastContainer />
        </div>
    );
}
