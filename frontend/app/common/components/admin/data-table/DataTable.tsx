import type { DataTableProps } from "./types";
import { CardView } from "./CardView";
import { TableView } from "./TableView";
import { PaginationFooter } from "./PaginationFooter";
import { EmptyState } from "./EmptyState";
import { LoadingState } from "./LoadingState";

export function DataTable<T>({
  data,
  columns,
  onRowClick,
  actions,
  isLoading = false,
  emptyMessage = "No hay datos disponibles",
  keyExtractor,
  pagination,
  onPageChange,
  pageSizeOptions = [10, 25, 50],
  onPageSizeChange,
}: DataTableProps<T>) {
  if (isLoading) {
    return <LoadingState />;
  }

  if (data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="space-y-4">
      {/* Mobile: Card View */}
      <CardView
        data={data}
        columns={columns}
        actions={actions}
        onRowClick={onRowClick}
        keyExtractor={keyExtractor}
      />

      {/* Desktop: Table View */}
      <TableView
        data={data}
        columns={columns}
        actions={actions}
        onRowClick={onRowClick}
        keyExtractor={keyExtractor}
      />

      {/* Pagination Footer */}
      {pagination && (
        <PaginationFooter
          pagination={pagination}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
          pageSizeOptions={pageSizeOptions}
          totalItems={pagination.totalItems}
        />
      )}
    </div>
  );
}
