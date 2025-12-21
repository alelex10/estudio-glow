import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import type { Category } from "~/common/types/product-types";
import { Button } from "~/common/components/Button";

interface Props {
    categories: Category[];
}

export function FilterSideBar({ categories }: Props) {

    return (
        <div className="sticky top-24 flex flex-col text-black bg-white px-4 py-10 min-w-[250px]">
            <h3 className="text-xl md:text-2xl font-bold text-black font-gabarito pb-2">
                Filtros
            </h3>
            {/* Out of Stock Toggle */}
            {/* <div className="flex items-center justify-between py-4 border-b border-primary-100/20 mb-2">
                <span className="text-lg font-normal tracking-wide">out of stock items</span>
                <button
                    onClick={() => setShowOutOfStock(!showOutOfStock)}
                    className={clsx(
                        "w-12 h-6 flex items-center rounded-none p-1 transition-colors duration-300",
                        showOutOfStock ? "bg-[#D4AF37]" : "bg-gray-200"
                    )}
                >
                    <div
                        className={clsx(
                            "bg-white w-4 h-4 shadow-md transform transition-transform duration-300",
                            showOutOfStock ? "translate-x-6" : "translate-x-0"
                        )}
                    />
                </button>
            </div> */}

            {/* Categories */}
            {categories.length > 0 ? (
            <div className="flex-1 space-y-2">
                <h4 className="text-lg font-bold tracking-wide mb-2">Categorias</h4>
                {categories.map((category) => (
                    <div key={category.id} className="border-b border-primary-600">

                        <div
                            className={clsx(
                                "space-y-3 overflow-hidden transition-all duration-300 ease-in-out pl-1",
                                "max-h-[500px] opacity-100 mb-2"
                            )}
                        >
                            <label key={category.id} className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer appearance-none w-5 h-5 border-2 border-primary-600 rounded-sm checked:bg-primary-600 checked:border-primary-600 transition-all"
                                    />
                                    <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                </div>
                                <span className="text-lg font-normal tracking-wide group-hover:text-primary-600 transition-colors">
                                    {category.name}
                                </span>
                            </label>
                        </div>
                    </div>
                ))}
                <Button variant="outline" className="mt-4">Filtrar</Button>
            </div>
            ) : (
                <p className="text-center text-gray-600">No hay categorías disponibles</p>
            )}
        </div>
    );
}
