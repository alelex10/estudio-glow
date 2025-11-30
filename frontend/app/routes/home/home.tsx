import { ProductCarousel } from "~/common/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/common/components/Footer";
import { useState, useEffect, useRef } from "react";
import Navbar from "~/common/components/Navbar";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export default function Home() {
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const heroRef = useRef<HTMLElement>(null);

  const products = [
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 1", price: 100 },
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 2", price: 150 },
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 3", price: 200 },
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 4", price: 120 },
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 5", price: 180 },
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 6", price: 220 },
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 7", price: 160 },
    { imageSrc: "/img/product-test/product-1.webp", title: "Product 8", price: 190 },
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsHeroVisible(entry.isIntersecting);
      },
      {
        threshold: 0.1, // Se activa cuando el 10% del hero es visible
      }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => {
      if (heroRef.current) {
        observer.unobserve(heroRef.current);
      }
    };
  }, []);

  return (
    <>
      <Navbar isHeroVisible={isHeroVisible} />
      <main className="relative text-primary-100">
        <section id="hero" ref={heroRef}>
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
