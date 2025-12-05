import clsx from "clsx";
import { LoadingSpinner } from "./LoadingSpinner";

interface Column<T> {
    key: keyof T | string;
    header: string;
    render?: (item: T) => React.ReactNode;
    className?: string;
}

interface DataTableProps<T> {
    data: T[];
    columns: Column<T>[];
    onRowClick?: (item: T) => void;
    actions?: (item: T) => React.ReactNode;
    isLoading?: boolean;
    emptyMessage?: string;
    keyExtractor: (item: T) => string | number;
}

export function DataTable<T>({
    data,
    columns,
    onRowClick,
    actions,
    isLoading = false,
    emptyMessage = "No hay datos disponibles",
    keyExtractor,
}: DataTableProps<T>) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <svg
                    className="w-16 h-16 mb-4 text-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                    />
                </svg>
                <p className="text-lg font-medium">{emptyMessage}</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {columns.map((column) => (
                            <th
                                key={String(column.key)}
                                className={clsx(
                                    "px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider",
                                    column.className
                                )}
                            >
                                {column.header}
                            </th>
                        ))}
                        {actions && (
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                                Acciones
                            </th>
                        )}
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                    {data.map((item) => (
                        <tr
                            key={keyExtractor(item)}
                            onClick={() => onRowClick?.(item)}
                            className={clsx(
                                "transition-colors",
                                onRowClick && "cursor-pointer hover:bg-gray-50"
                            )}
                        >
                            {columns.map((column) => (
                                <td
                                    key={String(column.key)}
                                    className={clsx("px-6 py-4 whitespace-nowrap", column.className)}
                                >
                                    {column.render
                                        ? column.render(item)
                                        : String((item as Record<string, unknown>)[column.key as string] ?? "")}
                                </td>
                            ))}
                            {actions && (
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {actions(item)}
                                    </div>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Botón de acción para la tabla
interface ActionButtonProps {
    onClick: () => void;
    variant?: "edit" | "delete" | "view";
    disabled?: boolean;
}

export function ActionButton({ onClick, variant = "view", disabled }: ActionButtonProps) {
    const variants = {
        view: {
            className: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
            ),
        },
        edit: {
            className: "text-primary-600 hover:text-primary-800 hover:bg-primary-50",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
            ),
        },
        delete: {
            className: "text-red-600 hover:text-red-800 hover:bg-red-50",
            icon: (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            ),
        },
    };

    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onClick();
            }}
            disabled={disabled}
            className={clsx(
                "p-2 rounded-lg transition-colors",
                variants[variant].className,
                disabled && "opacity-50 cursor-not-allowed"
            )}
        >
            {variants[variant].icon}
        </button>
    );
}
