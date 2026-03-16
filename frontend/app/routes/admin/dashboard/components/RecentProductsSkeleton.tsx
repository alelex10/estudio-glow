import { Package, ChevronRight } from "lucide-react";

export function RecentProductsSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between p-6 border-b border-gray-100">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
      </div>

      <div className="divide-y divide-gray-100">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            {/* Imagen skeleton */}
            <div className="w-12 h-12 rounded-lg bg-gray-200 animate-pulse shrink-0" />

            {/* Info skeleton */}
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse" />
            </div>

            {/* Precio y stock skeleton */}
            <div className="text-right space-y-1">
              <div className="h-4 bg-gray-200 rounded w-16 animate-pulse ml-auto" />
              <div className="h-3 bg-gray-200 rounded w-12 animate-pulse ml-auto" />
            </div>

            {/* Arrow skeleton */}
            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
