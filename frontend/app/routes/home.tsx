import type { Route } from "./+types/home";
import { ProductCard } from "~/components/Card";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export default function Home() {
  return (
    <>
      <ProductCard imageSrc="/product-1.webp" title="Product Name" price="100" />
    </>
  );
}
