import { useState } from "react";
import { Suspense } from "react";
import { Await, useLoaderData, useRevalidator } from "react-router";
import { requireAuth } from "~/common/actions/auth-helpers";
import { apiClient } from "~/common/config/api-client";
import { orderService } from "~/common/services/orderService";
import { StatusTabs } from "~/common/components/admin/StatusTabs";
import { DataTable } from "~/common/components/data-table";
import { ActionButton } from "~/common/components/data-table/ActionButton";
import { OrderDetailModal } from "~/common/components/admin/OrderDetailModal";
import { CreditCard, Eye, Receipt } from "lucide-react";
import { OrdersHeader } from "./components/OrdersHeader";
import { OrdersStats } from "./components/OrdersStats";
import { OrderPageSkeleton } from "./components/OrderPageSkeleton";
import { useOrdersFilters } from "./useOrdersFilters";
import {
  PAYMENT_CONFIG,
  STATUS_CONFIG,
  STATUS_OPTIONS,
} from "~/common/constants/order.constants";
import { StatusBadge } from "~/common/components/admin/StatusBadge";
import { PaymentBadge } from "~/common/components/admin/PaymentBadge";
import type { Route } from "./+types/order";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Admin | Órdenes y Pagos" },
    {
      name: "description",
      content: "Administración de órdenes y pagos de Glow Studio",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await requireAuth(request);
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(
    1,
    parseInt(url.searchParams.get("limit") || "10", 10),
  );
  const status = url.searchParams.get("status") || undefined;
  const paymentMethod = url.searchParams.get("paymentMethod") || undefined;
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  return {
    ordersPaginated: orderService.getOrdersPaginated(
      page,
      limit,
      status,
      paymentMethod,
      sortBy,
      sortOrder,
      token,
    ),
    token,
    initialPage: page,
    initialLimit: limit,
    initialStatus: status,
    initialPaymentMethod: paymentMethod,
  };
}

export default function AdminOrders({loaderData}:Route.ComponentProps) {
  const { revalidate, state } = useRevalidator();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderWithItems, setOrderWithItems] = useState<any>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  const {
    currentPage,
    currentLimit,
    currentStatus,
    handlePageChange,
    handlePageSizeChange,
    handleStatusFilter,
  } = useOrdersFilters(
    loaderData.initialPage,
    loaderData.initialLimit,
    loaderData.initialStatus,
    loaderData.initialPaymentMethod,
  );

  const handleAction = async (id: string, action: "approve" | "reject") => {
    const verb = action === "approve" ? "aprobar" : "rechazar";
    if (!window.confirm(`¿Estás seguro de que quieres ${verb} esta orden?`))
      return;

    setActionLoading(id + action);
    try {
      await apiClient<any>({
        token: loaderData.token,
        endpoint: `/orders/${id}/${action}`,
        options: { method: "POST" },
      });
      revalidate();
    } catch (err: any) {
      alert(`Error: ${err.message || "No se pudo procesar la acción"}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewDetail = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const orderDetail = await orderService.getAdminOrderDetail(
        order.id,
        loaderData.token,
      );
      setOrderWithItems(orderDetail);
    } catch (error) {
      console.error("Error loading order details:", error);
      setOrderWithItems(null);
    } finally {
      setLoadingItems(false);
    }
  };

  const columns = [
    {
      key: "id" as const,
      header: "ID Orden",
      render: (order: any) => (
        <span className="font-mono text-xs bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800 px-2 py-1 rounded-md border border-primary-200">
          #{order.id.slice(0, 8).toUpperCase()}
        </span>
      ),
    },
    {
      key: "createdAt" as const,
      header: "Fecha",
      render: (order: any) => {
        const date = new Date(order.createdAt);
        const day = date.getDate().toString().padStart(2, "0");
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const year = date.getFullYear().toString().slice(-2);
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${day}/${month}/${year}, ${hours}:${minutes}`;
      },
    },
    {
      key: "paymentMethod" as const,
      header: "Pago",
      render: (order: any) => <PaymentBadge paymentMethod={order.paymentMethod} />,
    },
    {
      key: "totalAmount" as const,
      header: "Monto",
      render: (order: any) => {
        const amount = Number(order.totalAmount);
        return (
          <span className="font-semibold text-gray-900">
            $
            {amount.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}
          </span>
        );
      },
    },
    {
      key: "status" as const,
      header: "Estado",
      render: (order: any) => <StatusBadge status={order.status} />,
    },
  ];

  return (
    <Suspense fallback={<OrderPageSkeleton />}>
      <Await resolve={loaderData.ordersPaginated}>
        {(ordersPaginated) => {
          const orders = ordersPaginated?.data || [];
          const pagination = ordersPaginated?.pagination;
          const pendingCount = orders.filter(
            (o: any) => o.status === "PENDING_VERIFICATION",
          ).length;

          return (
            <div className="space-y-6">
              <div className="bg-linear-to-br from-white via-primary-50/30 to-white rounded-2xl p-6 shadow-sm border border-primary-100">
                <OrdersHeader
                  pendingCount={pendingCount}
                  isLoading={state === "loading"}
                  onRefresh={() => revalidate()}
                />
              </div>

              <OrdersStats totalItems={pagination?.totalItems || 0} orders={orders} />

              <StatusTabs
                options={STATUS_OPTIONS}
                value={currentStatus}
                onChange={handleStatusFilter}
              />

              <DataTable
                data={orders}
                columns={columns}
                keyExtractor={(order) => order.id}
                pagination={pagination}
                onPageChange={handlePageChange}
                onPageSizeChange={handlePageSizeChange}
                pageSizeOptions={[10, 25, 50]}
                emptyMessage="No hay órdenes con este filtro."
                cardViewVariant="compact"
                actions={(order) => (
                  <>
                    {order.receiptUrl && (
                      <a
                        href={order.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-lg text-primary-600 hover:text-primary-800 hover:bg-primary-50 transition-colors"
                        title="Ver Comprobante"
                      >
                        <Receipt className="w-4 h-4" />
                      </a>
                    )}
                    <ActionButton
                      variant="view"
                      onClick={() => handleViewDetail(order)}
                      disabled={loadingItems}
                    />
                    {order.status === "PENDING_VERIFICATION" && (
                      <>
                        <ActionButton
                          variant="approve"
                          onClick={() => handleAction(order.id, "approve")}
                          disabled={actionLoading?.startsWith(order.id)}
                        />
                        <ActionButton
                          variant="reject"
                          onClick={() => handleAction(order.id, "reject")}
                          disabled={actionLoading?.startsWith(order.id)}
                        />
                      </>
                    )}
                  </>
                )}
              />

              {selectedOrder && (
                <OrderDetailModal
                  order={orderWithItems || selectedOrder}
                  isLoading={orderWithItems === null}
                  onClose={() => {
                    setSelectedOrder(null);
                    setOrderWithItems(null);
                  }}
                />
              )}
            </div>
          );
        }}
      </Await>
    </Suspense>
  );
}
