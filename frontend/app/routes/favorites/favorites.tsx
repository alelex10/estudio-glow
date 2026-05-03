import { Link, useNavigate, useFetcher } from "react-router";
import { Heart, ArrowLeft, ShoppingBag } from "lucide-react";
import clsx from "clsx";
import { FavoriteButton } from "~/common/components/button/FavoriteButton";
import type { FavoriteItem } from "~/common/types/user-types";
import Footer from "~/common/components/Footer";
import { requireAuth } from "~/common/actions/auth-helpers";
import { favoriteService } from "~/common/services/favoriteService";
import type { Route } from "./+types/favorites";
import { getCloudinaryUrl } from "~/common/lib/utils";

export function meta() {
  return [
    { title: "Mis Favoritos | Glow Studio" },
    {
      name: "description",
      content: "Tus productos favoritos en Glow Studio",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await requireAuth(request);
  const response = await favoriteService.list(token);
  return response.data;
}

export default function Favorites({ loaderData }: Route.ComponentProps) {
  const navigate = useNavigate();
  const favorites = loaderData || [];
  const fetcher = useFetcher();

  const handleFavoriteToggle = (productId: string) => {
    const action = `/actions/favorite/remove/${productId}`;
    const method = "DELETE";
    fetcher.submit(
      { productId },
      {
        method,
        action,
      }
    );
  };

  const isSubmitting = fetcher.state === "submitting";

  // LOADING
  // if (loading) {
  //   return (
  //     <div className="min-h-screen bg-primary-50 flex items-center justify-center">
  //       <div className="animate-pulse flex flex-col items-center gap-4">
  //         <Heart className="w-12 h-12 text-primary-300" />
  //         <p className="text-gray-400">Cargando favoritos...</p>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <>
      <main className="min-h-screen bg-primary-50 pt-24 pb-12">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate(-1)}
              className="inline-flex items-center gap-2 text-gray-500 hover:text-primary-600 transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Volver</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-xl">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">
                  Mis Favoritos
                </h1>
                <p className="text-sm text-gray-500">
                  {favorites?.length || 0}{" "}
                  {(favorites?.length || 0) === 1 ? "producto" : "productos"}
                </p>
              </div>
            </div>
          </div>

          {/* Grid de productos */}
          {favorites && favorites.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {favorites.map((fav) => {
                // Estado optimista: si se está eliminando, mostrar como no favorito
                const isRemoving = isSubmitting && fetcher.formData?.get("productId") === fav.product.id;
                const optimisticIsFav = !isRemoving;
                return (
                <Link
                  key={fav.id}
                  to={`/product/${fav.product.id}`}
                  className={clsx(
                    "group relative bg-white rounded-2xl overflow-hidden",
                    "border border-gray-100 shadow-sm hover:shadow-lg",
                    "transition-all duration-300 hover:-translate-y-1",
                  )}
                >
                  {/* Favorite button */}
                  <div className="absolute top-3 right-3 z-10">
                    <FavoriteButton
                      productId={fav.product.id}
                      size="sm"
                      isFav={optimisticIsFav}
                      onToggle={handleFavoriteToggle}
                    />
                  </div>

                  {/* Image */}
                  <div className="aspect-square overflow-hidden bg-gray-100">
                    {fav.product.imageUrl ? (
                      <img
                        src={getCloudinaryUrl(fav.product.imageUrl, 400)}
                        alt={fav.product.name}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-800 line-clamp-2 text-sm group-hover:text-primary-600 transition-colors">
                      {fav.product.name}
                    </h3>
                    <p className="text-lg font-bold text-primary-600 mt-2">
                      ${fav.product.price}
                    </p>
                  </div>
                </Link>
                );
              })}
            </div>
          ) : (
            /* Empty state */
            <div className="text-center py-20">
              <div className="inline-flex p-6 bg-gray-100 rounded-full mb-6">
                <Heart className="w-12 h-12 text-gray-300" />
              </div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">
                No tenés favoritos todavía
              </h2>
              <p className="text-gray-500 mb-6 max-w-sm mx-auto">
                Explorá nuestra tienda y tocá el ❤️ en los productos que te
                gusten
              </p>
              <Link
                to="/products"
                className={clsx(
                  "inline-flex items-center gap-2 px-6 py-3",
                  "bg-primary-500 hover:bg-primary-600 text-white",
                  "rounded-xl font-medium transition-colors",
                )}
              >
                <ShoppingBag className="w-5 h-5" />
                Explorar productos
              </Link>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
