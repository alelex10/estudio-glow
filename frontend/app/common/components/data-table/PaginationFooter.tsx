import clsx from "clsx";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationInfo } from "./types";

interface PaginationFooterProps {
  pagination: PaginationInfo;
  onPageChange?: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  totalItems: number;
}

export function PaginationFooter({
  pagination,
  onPageChange,
  pageSizeOptions = [10, 25, 50],
  onPageSizeChange,
  totalItems,
}: PaginationFooterProps) {
  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(startItem + totalItems - 1, pagination.totalItems);
  const remainingItems = Math.max(0, pagination.totalItems - endItem);

  if (pagination.totalItems === 0) return null;

  return (
    <div className="flex flex-col gap-3 px-2">
      {/* Info section - stacked on mobile, inline on desktop */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm">
            <span className="font-medium text-gray-900">{startItem}</span>
            <span className="text-gray-400 mx-1">-</span>
            <span className="font-medium text-gray-900">{endItem}</span>
            <span className="text-gray-400 mx-1">de</span>
            <span className="font-medium text-gray-900">{pagination.totalItems}</span>
          </span>
          {remainingItems > 0 && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              ({remainingItems} restantes)
            </span>
          )}
        </div>
        <span className="text-xs text-gray-500">
          Pág <span className="font-medium text-gray-900">{pagination.page}</span>/{pagination.totalPages}
        </span>
      </div>

      {/* Controls section */}
      <div className="flex items-center justify-between sm:justify-end gap-2">
        {/* Page size selector */}
        {onPageSizeChange && (
          <div className="flex items-center gap-1.5">
            <label className="text-xs text-gray-500">
              Mostrar:
            </label>
            <select
              value={pagination.limit}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Navigation buttons */}
        {onPageChange && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => onPageChange(pagination.page - 1)}
              disabled={!pagination.hasPreviousPage}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                pagination.hasPreviousPage
                  ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  : "text-gray-300 cursor-not-allowed"
              )}
              aria-label="Página anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Page numbers - desktop only */}
            <div className="hidden sm:flex items-center gap-0.5">
              {Array.from(
                { length: Math.min(5, pagination.totalPages) },
                (_, i) => {
                  let pageNum: number;
                  if (pagination.totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.totalPages - 2) {
                    pageNum = pagination.totalPages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={clsx(
                        "min-w-[2rem] h-8 text-sm font-medium rounded-lg transition-colors",
                        pageNum === pagination.page
                          ? "bg-primary-600 text-white"
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      )}
                    >
                      {pageNum}
                    </button>
                  );
                }
              )}
            </div>

            <button
              onClick={() => onPageChange(pagination.page + 1)}
              disabled={!pagination.hasNextPage}
              className={clsx(
                "p-2 rounded-lg transition-colors",
                pagination.hasNextPage
                  ? "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  : "text-gray-300 cursor-not-allowed"
              )}
              aria-label="Página siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
