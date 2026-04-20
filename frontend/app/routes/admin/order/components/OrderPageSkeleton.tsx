export function OrderPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
        <div className="flex-1 space-y-2">
          <div className="h-8 bg-gray-200 rounded w-48 animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-64 animate-pulse" />
        </div>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="h-8 bg-gray-200 rounded w-32 animate-pulse" />
          <div className="h-8 bg-gray-200 rounded w-24 animate-pulse" />
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-6 bg-gray-200 rounded w-24 animate-pulse" />
              <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Tabs Skeleton */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-gray-200 rounded-lg w-24 animate-pulse" />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Table Header */}
        <div className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-100">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="h-5 bg-gray-200 rounded w-20 animate-pulse" />
          ))}
        </div>
        {/* Table Rows */}
        {[1, 2, 3, 4, 5].map((row) => (
          <div key={row} className="grid grid-cols-7 gap-4 px-6 py-4 border-b border-gray-100 last:border-0">
            {[1, 2, 3, 4, 5, 6, 7].map((col) => (
              <div key={col} className="h-6 bg-gray-200 rounded w-full animate-pulse" />
            ))}
          </div>
        ))}
      </div>

      {/* Pagination Skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-5 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-gray-200 rounded w-8 animate-pulse" />
          ))}
        </div>
      </div>
    </div>
  );
}
