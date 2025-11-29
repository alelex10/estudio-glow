import { useState } from "react";
import { ProductCard } from "./Card";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";
import clsx from "clsx";

interface Product {
    imageSrc: string;
    title: string;
    price: number;
}

interface ProductCarouselProps {
    products: Product[];
}

export function ProductCarousel({ products }: ProductCarouselProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const colorDisabled = "bg-primary-600/10";
    const itemsPerPage = 4;
    const maxIndex = Math.max(0, products.length - itemsPerPage);

    const handlePrevious = () => {
        setCurrentIndex((prev) => Math.max(0, prev - 1));
    };

    const handleNext = () => {
        setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
    };

    const transformX = [
        `translate-x-60%`,
        `translate-x-120%`,
        `translate-x-180%`,
        `translate-x-240%`,
    ];

    return (
        <div className="relative w-full px-4">
            <button
                onClick={handlePrevious}
                disabled={currentIndex === 0}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-primary-400 hover:bg-primary-600 disabled:${colorDisabled} disabled:cursor-not-allowed text-primary-100 p-3 rounded-full transition-all duration-300 shadow-lg`}
                aria-label="Anterior"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </button>

            <div className="overflow-hidden md:mx-12 ">
                <div
                    className={clsx("flex md:gap-3 transition-transform duration-500 ease-in-out p-6",
                        "transform",
                        transformX[currentIndex]
                    )}
                    // style={{
                    //     transform: `translateX(-${currentIndex * (100 / itemsPerPage)}%)`,
                    // }}
                >
                    {products.map((product, index) => (
                        <div
                            key={index}
                            className={clsx("shrink-0",
                                "w-full",
                                "md:w-1/2",
                                "lg:w-1/3",
                                "xl:w-1/4",
                            )}
                            // style={{ width: `calc(${100 / itemsPerPage}% - ${(6 * (itemsPerPage - 1)) / itemsPerPage}px)` }}
                        >
                            <ProductCard
                                imageSrc={product.imageSrc}
                                title={product.title}
                                price={product.price}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <button
                onClick={handleNext}
                disabled={currentIndex >= maxIndex}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-primary-500 hover:bg-primary-600 disabled:${colorDisabled} disabled:cursor-not-allowed text-primary-100 p-3 rounded-full transition-all duration-300 shadow-lg`}
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
