import { useSearchParams } from "react-router";

export function useOrdersFilters(initialPage: number, initialLimit: number, initialStatus?: string, initialPaymentMethod?: string) {
  const [searchParams, setSearchParams] = useSearchParams();

  const currentPage = parseInt(searchParams.get("page") || initialPage.toString(), 10);
  const currentLimit = parseInt(searchParams.get("limit") || initialLimit.toString(), 10);
  const currentStatus = searchParams.get("status") || initialStatus || "ALL";
  const currentPaymentMethod = searchParams.get("paymentMethod") || initialPaymentMethod || undefined;

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", page.toString());
    setSearchParams(params);
  };

  const handlePageSizeChange = (limit: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("limit", limit.toString());
    params.set("page", "1");
    setSearchParams(params);
  };

  const handleStatusFilter = (status: string) => {
    const params = new URLSearchParams(searchParams);
    if (status === "ALL") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    params.set("page", "1");
    setSearchParams(params);
  };

  return {
    currentPage,
    currentLimit,
    currentStatus,
    currentPaymentMethod,
    handlePageChange,
    handlePageSizeChange,
    handleStatusFilter,
  };
}
