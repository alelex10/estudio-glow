import { Button } from "~/common/components/Button";
import Footer from "~/common/components/Footer";
import { ChevronDown, Star, ArrowLeft } from "lucide-react";
import { productService } from "~/common/services/productService";
import type { Route } from "./+types/product.$id";
import { useLoaderData, useNavigate } from "react-router";
import clsx from "clsx";

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

  if (!product) {
    throw new Error("No se encontro el producto");
  }

  return (
    <>
      <main className=" bg-white pb-3 ">
        {/* Mobile and Desktop Layout */}
        <div className="max-w-7xl mx-auto h-fit ">
          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 z-10 w-10 h-10 bg-white/80 backdrop-blur-sm rounded-full flex items-center justify-center text-primary-700 hover:text-primary-900 hover:bg-white transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="lg:grid lg:grid-cols-2 lg:gap-12">
            {/* Image Gallery */}
            <div className="mb-8 lg:mb-0 absolute top-0">
              <div className="space-y-4">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Product Info */}
            <div
              className={clsx(
                "bg-linear-to-b from-primary-300/40 to-primary-400/40 p-6 lg:p-8",
                "rounded-2xl border border-primary-400 mx-3",
                "backdrop-blur-xs mt-[80%] ",
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
              <p className=" mb-6 leading-relaxed">{product.description}</p>

              {/* Badges */}
              <div className="flex gap-3 mb-6 flex-wrap">
                <span className="px-4 py-1.5 bg-white text-primary-900 text-sm font-medium rounded-full border border-primary-400">
                  {product.category.name}
                </span>
              </div>

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
