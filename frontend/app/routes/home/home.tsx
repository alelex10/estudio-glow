import { ProductCarousel } from "~/common/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/common/components/Footer";
import { useState, useEffect, Suspense } from "react";
import Navbar from "~/common/components/Navbar";
import {
  dehydrate,
  HydrationBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { queryClient } from "~/common/config/query-client";
import { newProductsQuery } from "~/common/hooks/queries/productQueries";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export async function loader() {
  await queryClient.ensureQueryData(newProductsQuery());
  return { dehydratedState: dehydrate(queryClient) };
}

export default function HomeRoute({ loaderData }: Route.ComponentProps) {
  return (
    <HydrationBoundary state={loaderData.dehydratedState}>
      <Suspense fallback={<div>Cargando productos...</div>}>
        <Home />
      </Suspense>
    </HydrationBoundary>
  );
}

function Home() {
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const { data: newProducts } = useSuspenseQuery(newProductsQuery());

  useEffect(() => {
    const handleScroll = () => {
      setIsHeroVisible(window.scrollY === 0);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      <Navbar isBackgroundVisible={isHeroVisible} />
      <main className="relative text-primary-100">
        <section id="hero">
          <Hero />
        </section>
        <img className="py-20" src="/img/home/home-2.avif" alt="" />
        <section
          id="mas-nuevo"
          className="text-center text-primary-800 text-3xl md:text-5xl py-10"
        >
          <h2 className="font-playfair tracking-wide mb-10">Lo mas nuevo </h2>
          <ProductCarousel products={newProducts.data || []} />
        </section>
      </main>
      <Footer />
    </>
  );
}
