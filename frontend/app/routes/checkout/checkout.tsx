import { useState } from "react";
import { useNavigate, useLoaderData, redirect } from "react-router";
import type { Route } from "./+types/checkout";
import { apiClient } from "../../common/config/api-client";
import { API_ENDPOINTS } from "../../common/config/api-end-points";
import { useCart } from "../../common/context/CartContext";
import { getToken } from "../../common/services/auth.server";
import { Button } from "~/common/components/button/Button";
import { CreditCard, Building2, Upload, ArrowRight } from "lucide-react";
import { EmptyCartState } from "~/common/components/cart/EmptyCartState";
import { CartItemsList } from "~/common/components/cart/CartItemsList";
import { OrderSummarySidebar } from "~/common/components/cart/OrderSummarySidebar";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Verificar Pedido | Glow Studio" },
    { name: "description", content: "Verificar Pedido de Glow Studio" },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getToken(request);
  if (!token) {
    throw redirect("/login?redirect=/checkout");
  }
  return { token };
}

export default function Checkout() {
  const { token } = useLoaderData<typeof loader>();
  const [method, setMethod] = useState<"MERCADO_PAGO" | "TRANSFER">("MERCADO_PAGO");
  const [receipt, setReceipt] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { items, clearCart, totalPrice, totalItems } = useCart();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: Sync local cart items to backend DB
      if (items.length === 0) {
        throw new Error("Tu carrito está vacío");
      }

      await apiClient<any>({
        token,
        endpoint: API_ENDPOINTS.CART.SYNC,
        options: {
          method: "POST",
          body: JSON.stringify({
            items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
          }),
        },
      });

      // Step 2: Proceed with checkout
      if (method === "MERCADO_PAGO") {
        const data = await apiClient<any>({
          token,
          endpoint: API_ENDPOINTS.CHECKOUT.MERCADO_PAGO,
          options: { method: "POST" }
        });
        if (data.preferenceUrl) {
          window.location.href = data.preferenceUrl;
        }
      } else {
        if (!receipt) throw new Error("Debe subir un comprobante para continuar");
        
        const formData = new FormData();
        formData.append("receipt", receipt);

        await apiClient<any>({
          token,
          endpoint: API_ENDPOINTS.CHECKOUT.TRANSFER,
          options: {
            method: "POST",
            body: formData
          }
        });
        
        // Success
        clearCart();
        alert("Orden creada exitosamente. Un administrador validará el pago.");
        navigate("/");
      }
    } catch (err: any) {
      setError(err.message || "Ocurrió un error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-7xl">
        <EmptyCartState onNavigate={() => navigate('/products')} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 pt-20 pb-6 sm:pb-8 min-h-screen max-w-7xl">
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-primary-900 mb-2">Checkout</h1>
        <p className="text-gray-600 text-sm sm:text-base">Completa tu pedido de {totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
      </div>

      {error && <div className="bg-danger-50 text-danger-600 p-3 rounded-lg mb-4 border-2 border-danger-200">{error}</div>}

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
          <form onSubmit={handleCheckout} className="bg-white p-4 sm:p-6 rounded-lg border-5 border-primary-400 shadow-lg">
            <h2 className="text-xl sm:text-2xl font-bold text-primary-900 mb-4 sm:mb-6 pb-4 border-b-2 border-primary-200">
              Método de Pago
            </h2>
            
            <div className="space-y-3 sm:space-y-4 mb-6">
              <label 
                className={`flex items-center gap-3 sm:gap-4 p-4 rounded-lg cursor-pointer transition-all border-2 ${
                  method === "MERCADO_PAGO" 
                    ? "border-primary-500 bg-primary-50" 
                    : "border-primary-200 hover:border-primary-300 hover:bg-primary-50"
                }`}
              >
                <input 
                  type="radio" 
                  name="method" 
                  checked={method === "MERCADO_PAGO"} 
                  onChange={() => setMethod("MERCADO_PAGO")}
                  className="w-5 h-5 sm:w-4 sm:h-4 text-primary-600"
                />
                <CreditCard className="w-6 h-6 sm:w-5 sm:h-5 text-primary-600" />
                <div className="flex-1">
                  <span className="font-semibold text-primary-900 text-base sm:text-lg">Mercado Pago</span>
                  <p className="text-gray-600 text-xs sm:text-sm">Pago automático y seguro</p>
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
                  name="method" 
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
              disabled={loading || (method === "TRANSFER" && !receipt)}
              className="w-full"
            >
              {loading ? "Procesando..." : "Confirmar y Pagar"}
              <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
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
