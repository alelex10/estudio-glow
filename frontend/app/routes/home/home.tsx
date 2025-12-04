import { ProductCarousel } from "~/common/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/common/components/Footer";
import { useState, useEffect } from "react";
import Navbar from "~/common/components/Navbar";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export default function Home() {
  const [isHeroVisible, setIsHeroVisible] = useState(true);

  const products = [
    { id: 1, imageSrc: "/img/product-test/product-1.webp", title: "Product 1", price: 100 },
    { id: 2, imageSrc: "/img/product-test/product-1.webp", title: "Product 2", price: 150 },
    { id: 3, imageSrc: "/img/product-test/product-1.webp", title: "Product 3", price: 200 },
    { id: 4, imageSrc: "/img/product-test/product-1.webp", title: "Product 4", price: 120 },
    { id: 5, imageSrc: "/img/product-test/product-1.webp", title: "Product 5", price: 180 },
    { id: 6, imageSrc: "/img/product-test/product-1.webp", title: "Product 6", price: 220 },
    { id: 7, imageSrc: "/img/product-test/product-1.webp", title: "Product 7", price: 160 },
    { id: 8, imageSrc: "/img/product-test/product-1.webp", title: "Product 8", price: 190 },
  ];

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
        <section id="mas-vendidos" className="text-center text-primary-800 text-3xl md:text-5xl py-10">
          <h2 className="font-playfair tracking-wide mb-10">Mas vendidos </h2>
          <ProductCarousel products={products} />
        </section>
        <section id="mas-nuevo" className="text-center text-primary-800 text-3xl md:text-5xl py-10">
          <h2 className="font-playfair tracking-wide mb-10">Lo mas nuevo </h2>
          <ProductCarousel products={products} />
        </section>
      </main>
      <Footer />
    </>

  );
}
