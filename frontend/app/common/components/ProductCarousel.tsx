import { useState } from "react";
import { ProductCard } from "./Card";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import clsx from "clsx";
import { useBreakpoint } from "../hooks/useBreakpoint";
import { useEffect } from "react";
import type { Product } from "../types/product-types";

interface ProductCarouselProps {
    products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
    const breakpoint = useBreakpoint();
    const [currentIndex, setCurrentIndex] = useState(0);

    const itemsPerPage = {
        sm: 1,
        md: 2,
        lg: 3,
        xl: 4,
        '2xl': 4,
    }[breakpoint];

    useEffect(() => {
        setCurrentIndex(0);
    }, [itemsPerPage]);

    const colorDisabled = "bg-primary-600/10";
    const maxIndex = Math.max(0, products.length - itemsPerPage);

    const handlePrevious = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    return (
        <div className="relative w-full px-4">
            <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={clsx(`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary-400 disabled:${colorDisabled} disabled:cursor-not-allowed text-primary-100 p-3 rounded-full transition-all duration-300 shadow-lg`,
                    "hover:bg-primary-600 hover:cursor-pointer"
                )}
                aria-label="Anterior"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </button>

            <div className="overflow-hidden md:mx-12 ">
                <div
                    className={clsx("flex transition-transform duration-500 ease-in-out",
                        "transform"
                    )}
                    style={{
                        transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                    }}
                >
                    {products.map((product, index) => (
                        <div
                            key={index}
                            className={clsx("shrink-0 flex justify-center",
                                "w-full",
                                "md:w-1/2",
                                "lg:w-1/3",
                                "xl:w-1/4",
                            )}
                        >
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

            <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className={clsx(`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary-500 hover:bg-primary-600 disabled:${colorDisabled} disabled:cursor-not-allowed text-primary-100 p-3 rounded-full transition-all duration-300 shadow-lg`,
                    "hover:cursor-pointer")}
                aria-label="Siguiente"
            >
                <ArrowRightIcon className="w-6 h-6" />
            </button>

            <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrentIndex(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${currentIndex === index ? "w-8 bg-primary-500" : "w-2 bg-primary-300 cursor-pointer"
                            }`}
                        aria-label={`Ir a la página ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}
