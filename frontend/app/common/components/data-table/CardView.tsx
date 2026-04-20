import clsx from "clsx";
import type { Column } from ".";

interface CardViewProps<T> {
  data: T[];
  columns: Column<T>[];
  actions?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
  keyExtractor: (item: T) => string | number;
  variant?: "default" | "compact";
}

export function CardView<T>({
  data,
  columns,
  actions,
  onRowClick,
  keyExtractor,
  variant = "default",
}: CardViewProps<T>) {
  return (
    <div className="sm:hidden space-y-3">
      {data.map((item) => {
        // Check if first column has an image (common pattern)
        const firstColumn = columns[0];
        const hasImageColumn = firstColumn?.key === "image" || firstColumn?.key === "photo" || firstColumn?.key === "thumbnail";
        const mainColumns = hasImageColumn ? columns.slice(1) : columns;

        return (
          <div
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={clsx(
              "bg-white rounded-xl border border-primary-400 p-4",
              onRowClick && "cursor-pointer active:bg-gray-50"
            )}
          >
            {/* Two column layout when there's an image */}
            {hasImageColumn ? (
              <div className="flex gap-4">
                {/* Image column - larger */}
                <div className="shrink-0">
                  {firstColumn.render ? (
                    firstColumn.render(item)
                  ) : (
                    <div className="w-20 h-20 rounded-lg bg-gray-100" />
                  )}
                </div>

                {/* Info columns - grid layout */}
                <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {mainColumns.map((column, colIndex) => (
                    <div key={`card-${colIndex}-${String(column.key)}`} className={clsx(
                      "flex flex-col",
                      // Span full width for certain columns
                      column.key === "name" && "col-span-2"
                    )}>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide">
                        {column.header}
                      </span>
                      <div className="text-sm text-gray-700 truncate">
                        {column.render
                          ? column.render(item)
                          : String(
                              (item as Record<string, unknown>)[
                                column.key as string
                              ] ?? ""
                            )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Single column layout for non-image data */
              variant === "compact" ? (
                /* Compact layout - grid of 2 columns */
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {columns.map((column, colIndex) => (
                    <div 
                      key={`card-compact-${colIndex}-${String(column.key)}`} 
                      className="flex flex-col"
                    >
                      <span className="text-[10px] text-primary-900 uppercase tracking-wide">
                        {column.header}
                      </span>
                      <div className="text-sm text-gray-700 truncate">
                        {column.render
                          ? column.render(item)
                          : String(
                              (item as Record<string, unknown>)[
                                column.key as string
                              ] ?? ""
                            )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Default layout - vertical list */
                <div className="space-y-1.5">
                  {columns.map((column, colIndex) => (
                    <div 
                      key={`card-list-${colIndex}-${String(column.key)}`} 
                      className={clsx(
                        "flex gap-2",
                        colIndex === 0 ? "items-start" : "items-center"
                      )}
                    >
                      <span className="text-[10px] text-gray-400 uppercase tracking-wide shrink-0 min-w-16">
                        {column.header}:
                      </span>
                      <div className="text-sm text-gray-700 flex-1 min-w-0">
                        {column.render
                          ? column.render(item)
                          : String(
                              (item as Record<string, unknown>)[
                                column.key as string
                              ] ?? ""
                            )}
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* Card Actions */}
            {actions && (
              <div className="pt-3 mt-3 border-t border-gray-100 flex justify-end gap-2">
                {actions(item)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
