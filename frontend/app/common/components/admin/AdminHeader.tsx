import clsx from "clsx";
import { authService } from "../../services/authService";
import { useNavigate, useSubmit } from "react-router";
import type { User } from "~/common/types/user-types";

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick: () => void;
  actions?: React.ReactNode;
  user: User | null;
}

export function AdminHeader({
  title,
  subtitle,
  onMenuClick,
  actions,
  user,
}: AdminHeaderProps) {
  const navigate = useNavigate();
  const submit = useSubmit();

  const handleLogout = async () => {
    try {
      await authService.logout();
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
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-gray-100">
      <div className="flex items-center justify-between px-4 lg:px-8 py-4">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Menu button (mobile) */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-gray-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Title */}
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-gray-900">
              {title}
            </h1>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          {/* Actions */}
          {actions}

          {/* User menu */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.name || "Admin"}
              </p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>

            <div className="relative group">
              <button
                className={clsx(
                  "flex items-center gap-2 p-2 rounded-full",
                  "bg-gradient-to-br from-primary-400 to-primary-600",
                  "text-white font-medium",
                  "hover:shadow-lg hover:shadow-primary-500/30 transition-all"
                )}
              >
                <span className="w-8 h-8 flex items-center justify-center">
                  {user?.name?.[0]?.toUpperCase() || "A"}
                </span>
              </button>

              {/* Dropdown */}
              <div
                className={clsx(
                  "absolute right-0 mt-2 w-48 py-2",
                  "bg-white rounded-xl shadow-xl border border-gray-100",
                  "opacity-0 invisible group-hover:opacity-100 group-hover:visible",
                  "transition-all duration-200 transform origin-top-right",
                  "group-hover:translate-y-0 -translate-y-2"
                )}
              >
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
