import { ProductCarousel } from "~/common/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/common/components/Footer";
import { useState, useEffect, Suspense } from "react";
import Navbar from "~/common/components/Navbar";
import { Await } from "react-router";
import { getQueryClient, queryClient } from "~/common/config/query-client";
import { newProductsQuery } from "~/common/hooks/queries/useProductQuerys";
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useQuery,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { productService } from "~/common/services/productService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

// export async function loader() {
//   const queryClient = getQueryClient();
//   await queryClient.ensureQueryData(newProductsQuery());
//   return {};
// }

export default function Home({ loaderData }: Route.ComponentProps) {
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  // const { newProducts } = loaderData;
  const { data: newProducts } = useQuery({
    queryKey: ["new-products"],
    queryFn: () => productService.getNewProducts(),
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsHeroVisible(window.scrollY === 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  if (!newProducts) {
    return null;
  }

  return (
    <>
      <Navbar isBackgroundVisible={isHeroVisible} />
      <main className="relative text-primary-100">
        <section id="hero">
          <Hero />
        </section>
        <img className="py-20" src="/img/home/home-2.avif" alt="" />
        {/* <section id="mas-vendidos" className="text-center text-primary-800 text-3xl md:text-5xl py-10">
          <h2 className="font-playfair tracking-wide mb-10">Mas vendidos </h2>
          <ProductCarousel products={newProducts} />
        </section> */}
        <section
          id="mas-nuevo"
          className="text-center text-primary-800 text-3xl md:text-5xl py-10"
        >
          <h2 className="font-playfair tracking-wide mb-10">Lo mas nuevo </h2>
          <Suspense fallback={<div>Loading...</div>}>
            <Await resolve={newProducts.data}>
              {(newProducts) =>
                newProducts ? (
                  <ProductCarousel products={newProducts} />
                ) : (
                  "No hay productos"
                )
              }
            </Await>
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
