import clsx from "clsx";
import type { Column } from "./types";

interface TableViewProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
}

export function TableView<T>({
  data,
  columns,
  actions,
  onRowClick,
  keyExtractor,
}: TableViewProps<T>) {
  return (
    <div className="hidden sm:block overflow-x-auto rounded-xl border border-gray-200 shadow-sm">
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
