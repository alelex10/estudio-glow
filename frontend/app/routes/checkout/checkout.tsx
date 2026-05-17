import { useState, useEffect, useRef } from "react";
import { Form, useActionData, useNavigation, useNavigate, redirect } from "react-router";
import type { Route } from "./+types/checkout";
import { apiClient, ApiError } from "../../common/config/api-client";
import { useCart } from "../../common/context/CartContext";
import { getToken } from "../../common/services/auth.server";
import { Button } from "~/common/components/button/Button";
import { CreditCard, Building2, Upload, ArrowRight } from "lucide-react";
import { EmptyCartState } from "~/common/components/cart/EmptyCartState";
import { CartItemsList } from "~/common/components/cart/CartItemsList";
import { OrderSummarySidebar } from "~/common/components/cart/OrderSummarySidebar";
import { ROUTES } from "~/common/constants/routes";
import { toast } from "~/common/components/Toast";
import { z } from "zod";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Verificar Pedido | Glow Studio" },
    { name: "description", content: "Verificar Pedido de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);
  if (!token) {
    throw redirect(`${ROUTES.LOGIN}?redirect=${ROUTES.CHECKOUT}`);
  }
  return {};
}

export async function action({ request }: Route.ActionArgs) {
  const token = await getToken(request);
  if (!token) {
    return { error: "Debes iniciar sesión para continuar" };
  }

  const formData = await request.formData();
  const paymentMethod = formData.get("paymentMethod") as string;
  const cartItemsRaw = formData.get("cartItems") as string;

  if (!cartItemsRaw) {
    return { error: "Tu carrito está vacío" };
  }

  const cartItemsSchema = z.array(
    z.object({
      productId: z.string().uuid(),
      quantity: z.number().int().min(1),
    }),
  );
  let items: z.infer<typeof cartItemsSchema>;
  try {
    items = cartItemsSchema.parse(JSON.parse(cartItemsRaw));
  } catch {
    return { error: "Carrito inválido" };
  }
  if (items.length === 0) {
    return { error: "Tu carrito está vacío" };
  }

  // Same idempotency key for both attempts within this action invocation
  // so a double-submit at the network layer hits the backend cache.
  const idempotencyKey = crypto.randomUUID();

  try {
    // Create order directly with items (no intermediate sync needed)
    if (paymentMethod === "MERCADO_PAGO") {
      const checkoutData = await apiClient<{ preferenceUrl: string }>({
        token,
        endpoint: "/checkout/mercadopago",
        options: {
          method: "POST",
          body: JSON.stringify({ items }),
          headers: { "Idempotency-Key": idempotencyKey },
        },
      });
      return { preferenceUrl: checkoutData.preferenceUrl };
    }

    // TRANSFER: forward receipt file + items
    const receipt = formData.get("receipt") as File | null;
    if (!receipt) {
      return { error: "Debe subir un comprobante para continuar" };
    }

    const receiptFormData = new FormData();
    receiptFormData.set("receipt", receipt);
    receiptFormData.set("items", JSON.stringify(items));

    await apiClient<{ success: true }>({
      token,
      endpoint: "/checkout/transfer",
      options: {
        method: "POST",
        body: receiptFormData,
        headers: { "Idempotency-Key": idempotencyKey },
      },
    });

    return { success: true };
  } catch (err) {
    if (err instanceof ApiError) {
      const msg =
        err.code === "INSUFFICIENT_STOCK"
          ? "Stock insuficiente para uno o más productos"
          : err.code === "INVALID_CART"
            ? "Carrito inválido"
            : "Ocurrió un error inesperado";
      return { error: msg };
    }
    return { error: "Ocurrió un error inesperado" };
  }
}

export default function Checkout() {
  const [method, setMethod] = useState<"MERCADO_PAGO" | "TRANSFER">("TRANSFER");
  const [receipt, setReceipt] = useState<File | null>(null);
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";
  const navigate = useNavigate();
  const { items, clearCart, totalPrice, totalItems } = useCart();
  const processedActionData = useRef<typeof actionData>(undefined);

  // Handle action result: clear cart + redirect/notify / show errors
  useEffect(() => {
    if (!actionData) return;
    if (processedActionData.current === actionData) return;
    processedActionData.current = actionData;

    if ("preferenceUrl" in actionData && actionData.preferenceUrl) {
      clearCart();
      window.location.href = actionData.preferenceUrl;
    } else if ("success" in actionData && actionData.success) {
      clearCart();
      toast("success", "Orden creada exitosamente. Un administrador validará el pago.");
      navigate(ROUTES.HOME);
    } else if ("error" in actionData && actionData.error) {
      toast("error", String(actionData.error));
    }
  }, [actionData, clearCart, navigate]);

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-7xl">
        <EmptyCartState onNavigate={() => navigate(ROUTES.PRODUCTS)} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-primary-900 mb-2">Checkout</h1>
        <p className="text-gray-600 text-sm sm:text-base">Completa tu pedido de {totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Summary */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border-5 border-primary-400 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 sm:mb-6 pb-4 border-b-2 border-primary-200">
              Resumen del Pedido
            </h2>
            <CartItemsList items={items} readonly={true} />
          </div>

          {/* Payment Method */}
          <Form method="post" encType="multipart/form-data" className="bg-white p-4 sm:p-6 rounded-lg border-5 border-primary-400 shadow-lg">
            <input
              type="hidden"
              name="cartItems"
              value={JSON.stringify(items.map(i => ({ productId: i.productId, quantity: i.quantity })))}
            />
            <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 sm:mb-6 pb-4 border-b-2 border-primary-200">
              Método de Pago
            </h2>
            
            <div className="space-y-3 sm:space-y-4 mb-6">
              <label 
                className={`flex items-center gap-3 sm:gap-4 p-4 rounded-lg transition-all border-2 opacity-60 cursor-not-allowed ${
                  method === "MERCADO_PAGO" 
                    ? "border-primary-500 bg-primary-50" 
                    : "border-primary-200"
                }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="MERCADO_PAGO"
                  checked={method === "MERCADO_PAGO"} 
                  disabled
                  className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600"
                />
                <CreditCard className="w-6 h-6 sm:w-5 sm:h-5 text-primary-400" />
                <div className="flex-1">
                  <span className="font-semibold text-gray-400 text-base sm:text-lg">Mercado Pago</span>
                  <p className="text-gray-400 text-xs sm:text-sm">No disponible por el momento</p>
                </div>
              </label>

              <label 
                className={`flex items-center gap-3 sm:gap-4 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                  method === "TRANSFER" 
                    ? "border-primary-500 bg-primary-50" 
                    : "border-primary-200 hover:border-primary-300 hover:bg-primary-50"
                }`}
              >
                <input 
                  type="radio" 
                  name="paymentMethod" 
                  value="TRANSFER"
                  checked={method === "TRANSFER"} 
                  onChange={() => setMethod("TRANSFER")}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600"
                />
                <Building2 className="w-6 h-6 sm:w-5 sm:h-5 text-primary-600" />
                <div className="flex-1">
                  <span className="font-semibold text-primary-900 text-base sm:text-lg">Transferencia Bancaria</span>
                  <p className="text-gray-600 text-xs sm:text-sm">Validación manual</p>
                </div>
              </label>
            </div>

            {method === "TRANSFER" && (
              <div className="p-4 sm:p-6 bg-primary-50 rounded-lg border-2 border-primary-200 mb-6">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Building2 className="w-5 h-5 text-primary-700" />
                  <h3 className="font-semibold text-primary-900 text-base sm:text-lg">Datos para transferencia:</h3>
                </div>
                <div className="space-y-2 text-sm sm:text-base text-primary-800">
                  <p><span className="font-semibold">Alias:</span> ESTUDIO.GLOW</p>
                  <p><span className="font-semibold">CBU:</span> 0000000000000000000000</p>
                </div>
                
                <div className="mt-4 sm:mt-6">
                  <label className="block font-medium text-primary-900 mb-2 text-sm sm:text-base">
                    Cargar Comprobante *
                  </label>
                  <div className="relative">
                    <input 
                      type="file" 
                      name="receipt"
                      accept="image/*" 
                      onChange={e => setReceipt(e.target.files?.[0] || null)}
                      className="w-full bg-white border-2 border-primary-300 p-3 rounded-lg file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-primary-100 file:text-primary-900 file:font-semibold hover:file:bg-primary-200"
                    />
                    {receipt && (
                      <div className="mt-2 text-sm text-success-600 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        {receipt.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="gold"
              size="lg"
              type="submit"
              disabled={isSubmitting || (method === "TRANSFER" && !receipt)}
              className="w-full"
            >
              {isSubmitting ? "Procesando..." : "Confirmar y Pagar"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Form>
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1 order-first lg:order-last">
          <OrderSummarySidebar 
            totalItems={totalItems} 
            totalPrice={totalPrice} 
          />
        </div>
      </div>
    </div>
  );
}
