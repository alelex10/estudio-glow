import { ProductCard } from "~/components/Card";
import type { Route } from "./+types/home";
import Hero from "./components/Hero";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export default function Home() {
  return (
    <main className="relative text-primary-100">
      <Hero />
      <img className="py-20" src="/img/home/home-2.webp" alt="" />
      <section className="text-center text-primary-800  text-3xl md:text-5xl">
        <h2 className="font-playfair tracking-wide mb-10">Mas vendidos </h2>
        <div className="flex flex-wrap gap-10 justify-center">
          <ProductCard imageSrc="/img/product-test/product-1.webp" title="Product 1" price={100} />
          <ProductCard imageSrc="/img/product-test/product-1.webp" title="Product 1" price={100} />
          <ProductCard imageSrc="/img/product-test/product-1.webp" title="Product 1" price={100} />
          <ProductCard imageSrc="/img/product-test/product-1.webp" title="Product 1" price={100} />
          <ProductCard imageSrc="/img/product-test/product-1.webp" title="Product 1" price={100} />
          <ProductCard imageSrc="/img/product-test/product-1.webp" title="Product 1" price={100} />
        </div>
      </section>

    </main>
  );
}
