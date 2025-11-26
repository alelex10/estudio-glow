import { ProductCarousel } from "~/components/ProductCarousel";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";
import Footer from "~/components/Footer";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export default function Home() {
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

  return (
    <main className="relative text-primary-100">
      <Hero />
      <img className="py-20" src="/img/home/home-2.webp" alt="" />
      <section className="text-center text-primary-800 text-3xl md:text-5xl py-10">
        <h2 className="font-playfair tracking-wide mb-10">Mas vendidos </h2>
        <ProductCarousel products={products} />
      </section>
      <section className="text-center text-primary-800 text-3xl md:text-5xl py-10">
        <h2 className="font-playfair tracking-wide mb-10">Lo mas nuevo </h2>
        <ProductCarousel products={products} />
      </section>

      <Footer />
    </main>
  );
}
