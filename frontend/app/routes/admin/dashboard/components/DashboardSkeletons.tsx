export { StatsGridSkeleton } from "./StatsGridSkeleton";
export { RecentProductsSkeleton } from "./RecentProductsSkeleton";

export function InventoryValueSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      </div>
    </div>
  );
}

export function SalesValueSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-6 bg-gray-200 rounded w-32 animate-pulse" />
        <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="space-y-2">
        <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse" />
        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
      </div>
    </div>
  );
}
