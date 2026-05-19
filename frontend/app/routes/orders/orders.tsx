import { useState } from "react";
import { useLoaderData, useSearchParams } from "react-router";
import { requireAuth } from "~/common/actions/auth-helpers";
import { orderService } from "~/common/services/orderService";
import { StatusTabs } from "~/common/components/admin/StatusTabs";
import { DataTable } from "~/common/components/data-table";
import { OrderDetailModal } from "~/common/components/admin/OrderDetailModal";
import { CreditCard, Eye } from "lucide-react";
import { PAYMENT_CONFIG, STATUS_CONFIG, STATUS_OPTIONS } from "~/common/constants/order.constants";
import { StatusBadge } from "~/common/components/admin/StatusBadge";
import { PaymentBadge } from "~/common/components/admin/PaymentBadge";

export function meta() {
  return [
    { title: "Mis Pedidos | Glow Studio" },
    { name: "description", content: "Historial de compras de Glow Studio" },
  ];
}

export async function loader({ request }: any) {
  const token = await requireAuth(request);
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(url.searchParams.get("limit") || "10", 10));
  const status = url.searchParams.get("status") || undefined;
  const sortBy = url.searchParams.get("sortBy") || "createdAt";
  const sortOrder = url.searchParams.get("sortOrder") || "desc";

  const ordersPaginated = await orderService.getUserOrders(
    page,
    limit,
    sortBy,
    sortOrder,
    status,
    token,
  );

  return { ordersPaginated, initialStatus: status };
}

export default function UserOrders() {
  const { ordersPaginated, initialStatus } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [orderWithItems, setOrderWithItems] = useState<any>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  const currentStatus = searchParams.get("status") || "ALL";
  const orders = ordersPaginated?.data || [];
  const pagination = ordersPaginated?.pagination;

  const handleStatusFilter = (status: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (status === "ALL") {
      newParams.delete("status");
    } else {
      newParams.set("status", status);
    }
    newParams.delete("page"); // reset to page 1
    setSearchParams(newParams);
  };

  const handlePageChange = (newPage: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("page", newPage.toString());
    setSearchParams(newParams);
  };

  const handlePageSizeChange = (newLimit: number) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("limit", newLimit.toString());
    newParams.set("page", "1");
    setSearchParams(newParams);
  };

  const handleViewDetail = async (order: any) => {
    setSelectedOrder(order);
    setLoadingItems(true);
    try {
      const orderDetail = await orderService.getOrderDetail(order.id);
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
        <span className="font-mono text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
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
            ${amount.toLocaleString("en-US", {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
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
    {
      key: "receiptUrl" as const,
      header: "Comprobante",
      render: (order: any) => {
        return order.receiptUrl ? (
          <a
            href={order.receiptUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline"
          >
            <Eye className="w-3.5 h-3.5" />
            Ver Imagen
          </a>
        ) : (
          <span className="text-gray-400 text-xs">—</span>
        );
      },
    },
    {
      key: "detail" as const,
      header: "Detalle",
      render: (order: any) => (
        <button
          onClick={() => handleViewDetail(order)}
          className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 text-xs font-medium hover:underline"
        >
          <Eye className="w-3.5 h-3.5" />
          Ver Productos
        </button>
      ),
    },
  ];

  return (
    <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-7xl space-y-6">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-primary-900 mb-2">Mis Pedidos</h1>
        <p className="text-gray-600 text-sm sm:text-base">Historial de tus compras</p>
      </div>

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
        emptyMessage="No tienes pedidos con este filtro."
        cardViewVariant="compact"
      />

      {selectedOrder && (
        <OrderDetailModal 
          order={orderWithItems || selectedOrder} 
          onClose={() => {
            setSelectedOrder(null);
            setOrderWithItems(null);
          }} 
        />
      )}
    </div>
  );
}
