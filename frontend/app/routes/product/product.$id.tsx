import { Button } from "~/common/components/button/Button";
import Footer from "~/common/components/Footer";
import {
  ChevronDown,
  Star,
  ArrowLeft,
  Plus,
  Minus,
  ShoppingCart,
  ShoppingBag,
} from "lucide-react";
import { productService } from "~/common/services/productService";
import type { Route } from "./+types/product.$id";
import { useLoaderData, useNavigate, Link } from "react-router";
import clsx from "clsx";
import { useCart } from "~/common/context/CartContext";
import { useState } from "react";
import { ROUTES } from "~/common/constants/routes";
import { FavoriteButton } from "~/common/components/button/FavoriteButton";
import ImageGallery from "~/common/components/ImageGallery";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow | Productos" },
    { name: "description", content: "Panel de administración de Glow Studio" },
  ];
}

export async function loader({ params }: Route.LoaderArgs) {
  const { id } = params;
  if (!id) {
    throw new Error("No se proporciono un id");
  }
  const product = await productService.getProduct(id);

  if (!product) {
    throw new Error("No se encontro el producto");
  }
  return { product: product.data };
}

export default function ProductDetail() {
  const { product } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const { addToCart, totalItems } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= product.stock) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      imageUrl: product.imageUrl ?? undefined,
      quantity,
      stock: product.stock,
    });
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    handleAddToCart();
    navigate(ROUTES.CHECKOUT);
  };

  const isOutOfStock = product.stock === 0;

  return (
    <>
      <main className=" bg-white pb-3 ">
        {/* Mobile and Desktop Layout */}
        <div className="max-w-7xl mx-auto h-fit ">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] left-4 z-10 w-11 h-11 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-700 hover:text-primary-900 hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          {/* Favorite Button */}
          <FavoriteButton
            productId={product.id}
            size="md"
            className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-16 z-10"
          />

          {/* Cart Icon */}
          <Link
            to={ROUTES.CART}
            className="absolute top-[calc(1rem+env(safe-area-inset-top,0px))] right-4 z-10 w-11 h-11 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-700 hover:text-primary-900 hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </div>
          </Link>

          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Image Gallery */}
            <div className="lg:mb-0">
              <ImageGallery
                images={product.imageUrl ? [product.imageUrl] : []}
                alt={product.name}
              />
            </div>

            {/* Product Info */}
            <div
              className={clsx(
                "bg-linear-to-b from-primary-300/40 to-primary-400/40 p-6 lg:p-8",
                "rounded-t-2xl lg:rounded-2xl border border-primary-400 mx-3 lg:mx-0",
                "backdrop-blur-xs -mt-8 lg:mt-0 lg:self-center",
              )}
            >
              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-el-messiri font-bold mb-4">
                {product.name}
              </h1>

              {/* Price and Rating */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl lg:text-5xl font-bold text-blue-600/80">
                  ${product.price}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded">
                  <Star className="w-5 h-5 fill-blue-600/80 text-blue-600/80" />
                  {/* <span className="font-semibold text-lg"></span> */}
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-900 mb-6 leading-relaxed">{product.description}</p>

              {/* Badges */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <span className="px-4 py-1.5 bg-white text-primary-900 text-sm font-medium rounded-full border border-primary-400">
                  {product.category?.name || "Categoría"}
                </span>
                <span
                  className={clsx(
                    "px-4 py-1.5 text-sm font-medium rounded-full border",
                    isOutOfStock
                      ? "bg-red-100 text-red-800 border-red-300"
                      : product.stock < 5
                        ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                        : "bg-green-100 text-green-800 border-green-300",
                  )}
                >
                  {isOutOfStock ? "Sin stock" : `Stock: ${product.stock}`}
                </span>
              </div>

              {/* Quantity Selector */}
              {!isOutOfStock && (
                <div className="flex items-center gap-4 mb-6 bg-gray-50/20 p-4 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Cantidad:
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={quantity <= 1}
                      className="w-11 h-11 rounded-full border-2 border-primary-400 flex items-center justify-center hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Minus className="w-6 h-6" />
                    </button>
                    <span className="w-12 text-center font-semibold text-lg">
                      {quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={quantity >= product.stock}
                      className="w-11 h-11 rounded-full border-2 border-primary-400 flex items-center justify-center hover:bg-primary-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Plus className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {!isOutOfStock ? (
                  <>
                    <Button
                      variant="gold"
                      size="lg"
                      rounded="medium"
                      className="w-full text-lg font-semibold uppercase tracking-wider shadow-lg cursor-pointer hover:scale-105 transition-transform"
                      onClick={handleBuyNow}
                    >
                      Comprar ahora
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      rounded="medium"
                      className="w-full text-lg font-semibold uppercase tracking-wider shadow-lg cursor-pointer hover:scale-105 transition-transform flex items-center justify-center gap-2"
                      onClick={handleAddToCart}
                    >
                      <ShoppingCart className="w-5 h-5" />
                      Agregar al carrito
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="lg"
                    rounded="medium"
                    disabled
                    className="w-full text-lg font-semibold uppercase tracking-wider shadow-lg opacity-50 cursor-not-allowed"
                  >
                    Sin stock
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
