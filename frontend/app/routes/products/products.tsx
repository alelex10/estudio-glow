import { useState } from "react";
import clsx from "clsx";
import { ProductCard } from "~/common/components/Card";
import { FilterDrawer } from "./components/FilterDrawer";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import { FilterSideBar } from "./components/FilterSideBar";
import Footer from "~/common/components/Footer";
import { productService } from "~/common/services/productService";
import type { PaginationResponse } from "~/common/types/response";
import type { Category, Product } from "~/common/types/product-types";
import { Button } from "~/common/components/Button";
import Tooltip from "~/common/components/tooltip";

export async function loader() {
    const products = await productService.getProductsPaginated(1, 10);
    const categories = await productService.getCategories();
    return { products, categories: categories.data };
}
export async function action() {
    const products = await productService.getProductsFilter(1, 10, "", "", "");
    const categories = await productService.getCategories();
    return { products, categories: categories.data };
}
interface Props {
    loaderData: { products: PaginationResponse<Product>; categories: Category[] };
}

export default function Products({ loaderData }: Props) {
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const { products: productsData, categories } = loaderData;
    const [products, setProducts] = useState(productsData);
    const [isSortOpen, setIsSortOpen] = useState(false);

    const SORT_OPTIONS = [
        { label: "Precio: Menor a Mayor", sortBy: "price", sortOrder: "asc" },
        { label: "Precio: Mayor a Menor", sortBy: "price", sortOrder: "desc" },
        { label: "Nombre: A-Z", sortBy: "name", sortOrder: "asc" },
        { label: "Nombre: Z-A", sortBy: "name", sortOrder: "desc" },
    ];
    const handleSort = async (sortBy: string, sortOrder: string) => {
        setFilter(prev => ({ ...prev, sortBy, sortOrder }));
        const { category } = filter;
        const products = await productService.getProductsFilter(1, 10, category, sortOrder, sortBy);
        console.log(products);
        setProducts(products);
        setIsSortOpen(false);
    };

    const [filter, setFilter] = useState({
        category: "",
        sortOrder: "asc",
        sortBy: "price",
    });

    return (
        <>
            <main className="flex justify-center min-h-screen pt-24 px-4 bg-primary-100">

                <section className="max-w-7xl">

                    {/* Controls */}
                    <div className="flex gap-4 mb-8 md:justify-end">
                        <Button
                            onClick={() => setIsFilterOpen(true)}
                            variant="outline"
                            className="md:hidden"
                        >
                            <SlidersHorizontal size={18} />
                            Filtros
                        </Button>

                        <div className="w-full md:w-fit relative">
                            <Button
                                variant="outline"
                                onClick={() => setIsSortOpen(!isSortOpen)}
                            >
                                Ordenar
                                <ChevronDown size={18} className={clsx("transition-transform duration-200", isSortOpen && "rotate-180")} />
                            </Button>

                            {isSortOpen && (
                                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-primary-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                                    {SORT_OPTIONS.map((option, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleSort(option.sortBy, option.sortOrder)}
                                            className={clsx(
                                                "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-primary-50",
                                                filter.sortBy === option.sortBy && filter.sortOrder === option.sortOrder
                                                    ? "text-primary-600 font-medium bg-primary-50"
                                                    : "text-gray-600"
                                            )}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex gap-10">
                        <div className="hidden md:block">
                            <FilterSideBar categories={categories} />
                        </div>

                        {/* Product Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-x-4 gap-y-8">
                            {products.data.map((product) => (
                                <div key={product.id}>
                                    <ProductCard
                                        productId={product.id}
                                        imageUrl={product.imageUrl}
                                        name={product.name}
                                        price={product.price}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="md:hidden">
                        <FilterDrawer
                            categories={categories}
                            isOpen={isFilterOpen}
                            onClose={() => setIsFilterOpen(false)}
                        />
                    </div>
                </section>

            </main>
            <Footer className="mt-20" />
        </>

    );
}