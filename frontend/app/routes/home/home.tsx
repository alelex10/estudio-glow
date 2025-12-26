import { ProductCarousel } from "~/common/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/common/components/Footer";
import { useState, useEffect, Suspense } from "react";
import Navbar from "~/common/components/Navbar";
import { Await, useLoaderData } from "react-router";
import { productService } from "~/common/services/productService";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export async function loader() {
  try {
    const newProducts = (await productService.getNewProducts()).data;
    return { newProducts };
  } catch (error) {
    console.error("Error al obtener productos");
    return { newProducts: [] };
  }
}

export function HydrateFallback() {
  return <div>Loading...</div>;
}

export default function Home() {
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const { newProducts } = useLoaderData<typeof loader>();

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
            <Await resolve={newProducts}>
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
        <p className="mt-2">
          Tiempo de carga: {performance.now().toFixed(2)}ms
        </p>
      </main>
      <Footer />
    </>
  );
}
