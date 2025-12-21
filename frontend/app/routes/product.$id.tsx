import { Button } from "~/common/components/Button";
import Footer from "~/common/components/Footer";
import { ChevronDown, Star } from "lucide-react";
import { productService } from "~/common/services/productService";
import type { Route } from "./+types/product.$id";
import { useLoaderData } from "react-router";

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
  if (!product) {
    throw new Error("No se encontro el producto");
  }

  return (
    <>
      <main className="min-h-screen bg-white pt-20">
        {/* Mobile and Desktop Layout */}
        <div className="max-w-7xl mx-auto px-2 py-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Image Gallery */}
            <div className="mb-8 lg:mb-0">
              <div className="space-y-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-linear-to-b from-primary-300/40 to-primary-400/40 p-6 lg:p-8 h-fit">
              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-playfair text-primary-900 mb-4">
                {product.name}
              </h1>

              {/* Price and Rating */}
              <div className="flex items-center justify-between mb-6">
                <div className="text-4xl lg:text-5xl font-bold text-blue-600">
                  ${product.price}
                </div>
                <div className="flex items-center gap-2 bg-white px-3 py-1 rounded">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="font-semibold text-lg"></span>
                </div>
              </div>

              {/* Description */}
              <p className="text-primary-900 mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Badges */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <span className="px-4 py-1.5 bg-white text-primary-900 text-sm font-medium rounded-full border border-primary-400">
                  {product.category.name}
                </span>
              </div>

              {/* Other Benefits Dropdown */}
              {/* <div className="mb-8">
                <button
                  onClick={() => setShowBenefits(!showBenefits)}
                  className="flex items-center justify-between w-full text-blue-600 font-medium py-2"
                >
                  <span>Other benefits</span>
                  <ChevronDown
                    className={clsx(
                      "w-5 h-5 transition-transform duration-300",
                      showBenefits && "rotate-180"
                    )}
                  />
                </button>

                {showBenefits && (
                  <ul className="mt-4 space-y-2 text-primary-900">
                    {product.benefits.map((benefit: string, index: number) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-primary-600 mt-1">•</span>
                        <span>{benefit}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div> */}

              {/* Buy Button */}
              <Button
                variant="gold"
                size="lg"
                rounded="medium"
                className="w-full text-lg font-semibold uppercase tracking-wider shadow-lg"
              >
                Comprar
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
