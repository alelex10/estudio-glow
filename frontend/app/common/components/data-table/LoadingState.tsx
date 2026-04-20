import { LoadingSpinner } from "../admin/LoadingSpinner";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-12">
      <LoadingSpinner size="lg" />
    </div>
  );
}
