import { ProductCarousel } from "~/common/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/common/components/Footer";
import { useState, useEffect } from "react";
import Navbar from "~/common/components/Navbar";
import { useLoaderData } from "react-router";
import { productService } from "~/common/services/productService";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export async function loader() {
  try {
    
    const newProducts = (await productService.getNewProducts()).data
    return { newProducts };
  } catch (error) {
    console.error(error);
    return { newProducts: [] };
  }
}

export default function Home() {
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const { newProducts } = useLoaderData();

  useEffect(() => {
    const handleScroll = () => {
      // El navbar cambia de fondo apenas se hace scroll hacia abajo
      setIsHeroVisible(window.scrollY === 0);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <>
      <Navbar isBackgroundVisible={isHeroVisible} />
      <main className="relative text-primary-100">
        <section id="hero">
          <Hero />
        </section>
        <img className="py-20" src="/img/home/home-2.webp" alt="" />
        {/* <section id="mas-vendidos" className="text-center text-primary-800 text-3xl md:text-5xl py-10">
          <h2 className="font-playfair tracking-wide mb-10">Mas vendidos </h2>
          <ProductCarousel products={newProducts} />
        </section> */}
        <section id="mas-nuevo" className="text-center text-primary-800 text-3xl md:text-5xl py-10">
          <h2 className="font-playfair tracking-wide mb-10">Lo mas nuevo </h2>
          <ProductCarousel products={newProducts} />
        </section>
      </main>
      <Footer />
    </>

  );
}
