import clsx from "clsx";

interface SidebarItemProps {
    isActive: boolean;
    children: React.ReactNode;
}

export function SidebarItem({ isActive, children }: SidebarItemProps) {
    return (
        <div className={clsx(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200",
                    isActive
                      ? "bg-primary-500/20 text-primary-400 font-medium"
                      : "text-gray-400 hover:bg-gray-700/50 hover:text-white",
                  )}>
            {children}
            {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary-400" />
            )}
        </div>
    )
}