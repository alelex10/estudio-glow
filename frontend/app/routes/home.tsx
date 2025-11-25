import type { Route } from "./+types/home";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "Glow Studio" },
    { name: "description", content: "Welcome to Glow Studio" },
  ];
}

export default function Home() {
  return (
    <main className="relative">
      <Navbar />
      <Hero />
    </main>
  );
}
