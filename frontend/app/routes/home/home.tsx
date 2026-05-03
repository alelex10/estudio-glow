import { ProductCarousel } from "~/common/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/common/components/Footer";
import { Suspense } from "react";
import { productService } from "~/common/services/productService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export async function loader() {
  const newProducts = await productService.getNewProducts();
  return { newProducts };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <main className="relative text-primary-100">
        <section id="hero">
          <Hero />
        </section>
        <img className="py-20" src="/img/home/home-2.avif" alt="" />
        <section
          id="mas-nuevo"
          className="text-center text-primary-800 text-3xl md:text-5xl py-10"
        >
          <h2 className="tracking-wide mb-10">Lo mas nuevo </h2>
          <Suspense fallback={<div>Cargando productos...</div>}>
            <ProductCarousel products={loaderData.newProducts.data || []} />
          </Suspense>
        </section>
      </main>
      <Footer />
    </>
  );
}
