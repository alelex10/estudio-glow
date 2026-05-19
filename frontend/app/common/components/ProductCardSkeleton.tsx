export default function ProductCardSkeleton() {
  return (
    <div className="bg-white border-5 border-primary-400 p-3 pb-4 flex flex-col gap-3 rounded animate-pulse">
      {/* Image placeholder */}
      <div className="aspect-[4/5] bg-primary-100/50 rounded" />
      {/* Text lines */}
      <div className="flex flex-col gap-2">
        <div className="h-4 w-3/4 bg-primary-100/50 rounded" />
        <div className="h-4 w-1/2 bg-primary-100/50 rounded" />
      </div>
    </div>
  );
}
