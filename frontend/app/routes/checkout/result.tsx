import { useLoaderData, Link, redirect } from "react-router";
import type { Route } from "./+types/result";
import { requireAuth } from "~/common/actions/auth-helpers";
import { orderService } from "~/common/services/orderService";
import { ROUTES } from "~/common/constants/routes";
import { Button } from "~/common/components/button/Button";
import { z } from "zod";
import {
  CheckCircle,
  Clock,
  Receipt,
  XCircle,
  AlertCircle,
  Package,
  ArrowRight,
  ShoppingBag,
  ListOrdered,
} from "lucide-react";

export function meta() {
  return [
    { title: "Resultado del Pago | Glow Studio" },
    { name: "description", content: "Resultado de tu compra en Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await requireAuth(request);

  const url = new URL(request.url);
  const orderId = url.searchParams.get("orderId");

  if (!orderId) {
    throw redirect(ROUTES.CHECKOUT);
  }

  try {
    z.string().uuid().parse(orderId);
  } catch {
    throw redirect(ROUTES.CHECKOUT);
  }

  try {
    const order = await orderService.getOrderDetail(orderId, token);
    return { order };
  } catch (err: any) {
    // Si la orden no existe o el usuario no es dueño, redirigir a checkout
    if (err?.statusCode === 404 || err?.statusCode === 403) {
      throw redirect(ROUTES.CHECKOUT);
    }
    throw err;
  }
}

export default function CheckoutResult() {
  const { order } = useLoaderData<typeof loader>();
  const status = order?.status as string;

  const orderShortId = order?.id
    ? `#${order.id.slice(0, 8).toUpperCase()}`
    : "";

  const totalAmount = order?.totalAmount
    ? Number(order.totalAmount).toLocaleString("en-US", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })
    : "0";

  // PAID — éxito
  if (status === "PAID") {
    return (
      <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-3xl">
        <div className="bg-white p-6 sm:p-10 rounded-lg border-5 border-emerald-400 shadow-lg text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-emerald-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-emerald-900 mb-2">
            ¡Pago confirmado!
          </h1>
          <p className="text-gray-600 mb-6">
            Tu orden {orderShortId} fue pagada exitosamente.
          </p>

          <div className="bg-emerald-50 rounded-lg p-4 sm:p-6 mb-6 text-left">
            <h2 className="font-semibold text-emerald-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Resumen de la orden
            </h2>
            <div className="space-y-3">
              {order?.items?.map((item: any) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center text-sm"
                >
                  <span className="text-gray-700">
                    {item.product?.name || "Producto"} x{item.quantity}
                  </span>
                  <span className="font-medium text-gray-900">
                    ${Number(item.price * item.quantity).toLocaleString("en-US")}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-emerald-200 mt-4 pt-4 flex justify-between items-center">
              <span className="font-semibold text-emerald-900">Total</span>
              <span className="text-xl font-bold text-emerald-900">
                ${totalAmount}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={ROUTES.ORDERS}>
              <Button variant="gold" size="lg">
                <ListOrdered className="w-5 h-5" />
                Ver mis órdenes
              </Button>
            </Link>
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="outline" size="lg">
                <ShoppingBag className="w-5 h-5" />
                Seguir comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PENDING — MercadoPago procesando
  if (status === "PENDING") {
    return (
      <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-3xl">
        <div className="bg-white p-6 sm:p-10 rounded-lg border-5 border-amber-400 shadow-lg text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-amber-900 mb-2">
            Pago pendiente
          </h1>
          <p className="text-gray-600 mb-2">
            Mercado Pago está procesando tu pago.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Orden {orderShortId} — Total: ${totalAmount}
          </p>

          <div className="bg-amber-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-amber-800 text-sm">
              Esto puede tomar unos minutos. Recibirás una notificación cuando
              el pago se confirme. También podés volver a revisar el estado de
              tu orden en cualquier momento.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={ROUTES.ORDERS}>
              <Button variant="gold" size="lg">
                <ListOrdered className="w-5 h-5" />
                Ver mis órdenes
              </Button>
            </Link>
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="outline" size="lg">
                <ShoppingBag className="w-5 h-5" />
                Seguir comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // PENDING_VERIFICATION — transferencia
  if (status === "PENDING_VERIFICATION") {
    return (
      <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-3xl">
        <div className="bg-white p-6 sm:p-10 rounded-lg border-5 border-blue-400 shadow-lg text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Receipt className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-blue-900 mb-2">
            Pendiente de verificación
          </h1>
          <p className="text-gray-600 mb-2">
            Subiste un comprobante de transferencia.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Orden {orderShortId} — Total: ${totalAmount}
          </p>

          <div className="bg-blue-50 rounded-lg p-4 mb-6 text-left">
            <p className="text-blue-800 text-sm">
              Un administrador revisará tu comprobante y confirmará el pago.
              Podés seguir el estado de tu orden desde tu panel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={ROUTES.ORDERS}>
              <Button variant="gold" size="lg">
                <ListOrdered className="w-5 h-5" />
                Ver mis órdenes
              </Button>
            </Link>
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="outline" size="lg">
                <ShoppingBag className="w-5 h-5" />
                Seguir comprando
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // EXPIRED / CANCELLED — fallo
  if (status === "EXPIRED" || status === "CANCELLED") {
    const isExpired = status === "EXPIRED";
    return (
      <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-3xl">
        <div className="bg-white p-6 sm:p-10 rounded-lg border-5 border-red-400 shadow-lg text-center">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-red-900 mb-2">
            {isExpired ? "Orden expirada" : "Orden cancelada"}
          </h1>
          <p className="text-gray-600 mb-6">
            {isExpired
              ? `Tu orden ${orderShortId} expiró porque no se completó el pago a tiempo.`
              : `Tu orden ${orderShortId} fue cancelada.`}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to={ROUTES.PRODUCTS}>
              <Button variant="gold" size="lg">
                <ShoppingBag className="w-5 h-5" />
                Volver a la tienda
              </Button>
            </Link>
            <Link to={ROUTES.ORDERS}>
              <Button variant="outline" size="lg">
                <ListOrdered className="w-5 h-5" />
                Ver mis órdenes
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // CREATED u otros estados — esperando pago
  return (
    <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-3xl">
      <div className="bg-white p-6 sm:p-10 rounded-lg border-5 border-gray-300 shadow-lg text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-gray-500" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          Esperando pago
        </h1>
        <p className="text-gray-600 mb-2">
          Tu orden {orderShortId} fue creada pero aún no tiene un pago
          asociado.
        </p>
        <p className="text-gray-500 text-sm mb-6">
          Total: ${totalAmount}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to={ROUTES.CHECKOUT}>
            <Button variant="gold" size="lg">
              <ArrowRight className="w-5 h-5" />
              Ir al checkout
            </Button>
          </Link>
          <Link to={ROUTES.PRODUCTS}>
            <Button variant="outline" size="lg">
              <ShoppingBag className="w-5 h-5" />
              Seguir comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "No se pudo cargar el resultado del pago.";

  if (error instanceof Error) {
    message = error.message;
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-3xl">
      <div className="bg-white p-6 sm:p-10 rounded-lg border-5 border-red-400 shadow-lg text-center">
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-red-900 mb-2">
          Error
        </h1>
        <p className="text-gray-600 mb-6">{message}</p>
        <Link to={ROUTES.CHECKOUT}>
          <Button variant="gold" size="lg">
            Volver al checkout
          </Button>
        </Link>
      </div>
    </div>
  );
}
