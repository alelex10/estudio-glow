import clsx from "clsx";
import { Inbox, Eye, Edit, Trash2 } from "lucide-react";
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
        <Inbox className="w-16 h-16 mb-4 text-gray-300" />
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
                  className={clsx(
                    "px-6 py-4 whitespace-nowrap",
                    column.className
                  )}
                >
                  {column.render
                    ? column.render(item)
                    : String(
                        (item as Record<string, unknown>)[
                          column.key as string
                        ] ?? ""
                      )}
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

export function ActionButton({
  onClick,
  variant = "view",
  disabled,
}: ActionButtonProps) {
  const variants = {
    view: {
      className: "text-blue-600 hover:text-blue-800 hover:bg-blue-50",
      icon: <Eye className="w-4 h-4" />,
    },
    edit: {
      className: "text-primary-600 hover:text-primary-800 hover:bg-primary-50",
      icon: <Edit className="w-4 h-4" />,
    },
    delete: {
      className: "text-red-600 hover:text-red-800 hover:bg-red-50",
      icon: <Trash2 className="w-4 h-4" />,
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
