import { useState } from "react";
import { ProductCard } from "~/common/components/Card";
import { FilterDrawer } from "./components/FilterDrawer";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { FilterSideBar } from "./components/FilterSideBar";
import Footer from "~/common/components/Footer";
import { productService } from "~/common/services/productService";
import { useLoaderData } from "react-router";
import type { PaginationResponse, Product } from "~/common/types";

const PRODUCTS = [
    { id: 1, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
    { id: 2, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
    { id: 3, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
    { id: 4, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
    { id: 5, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
    { id: 6, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
    { id: 7, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
    { id: 8, imageSrc: "/img/product-test/product-1.webp", title: "Bronzeador", price: 55.00 },
];

export async function loader() {
    const products = await productService.getProductsPaginated(1, 10);
    return products;
}

export default function Products() {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const products: PaginationResponse<Product> = useLoaderData();

    return (
        <>
            <main className="flex justify-center min-h-screen pt-24 px-4 bg-primary-100">

                <section className="max-w-7xl">

                    {/* Controls */}
                    <div className="flex gap-4 mb-8 md:justify-end">
                        <button
                            onClick={() => setIsFilterOpen(true)}
                            className="flex-1 md:hidden md:w-48 flex items-center justify-center gap-2 bg-white py-3 px-4 border border-gray-200 hover:bg-gray-50 transition-colors"
                        >
                            <SlidersHorizontal size={18} />
                            <span className="uppercase tracking-wide text-sm font-medium">Filter</span>
                        </button>

                        <div className="flex-1 md:flex-none md:w-64 relative">
                            <button className="w-full flex items-center justify-between bg-white py-3 px-4 border border-gray-200 hover:bg-gray-50 transition-colors">
                                <span className="flex items-center gap-1 text-sm">
                                    <span className="font-bold">sort:</span> recommended
                                </span>
                                <ChevronDown size={18} />
                            </button>
                        </div>
                    </div>
                    <div className="flex gap-10">
                        <div className="hidden md:block">
                            <FilterSideBar />
                        </div>
                        {/* Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                            {products.data.map((product) => (
                                <div key={product.id}>
                                    <ProductCard
                                        productId={product.id}
                                        imageSrc={product.imageUrl}
                                        title={product.name}
                                        price={product.price}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>


                </section>
                <div className="md:hidden">
                    <FilterDrawer
                        isOpen={isFilterOpen}
                        onClose={() => setIsFilterOpen(false)}
                    />
                </div>

            </main>
            <Footer className="mt-20" />
        </>

    );
}