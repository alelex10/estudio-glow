import { useState } from "react";
import Drawer from "~/common/components/Drawer";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import type { Category } from "~/common/types/product-types";

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

interface Props {
    categories: Category[];
    isOpen: boolean;
    onClose: () => void;
}

export function FilterDrawer({ categories, isOpen, onClose }: Props) {
    return (
        <Drawer isOpen={isOpen} onClose={onClose} >
            <div className="flex flex-col h-full text-primary-100">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-gabarito font-bold tracking-wide">Filtros</h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {categories.map((category) => (
                        <div key={category.id} className="border-b border-primary-100/20 pb-4">
                            <div
                                className={clsx(
                                    "space-y-3 overflow-hidden transition-all duration-300 ease-in-out",
                                    "max-h-96 opacity-100"
                                )}
                            >
                            </div>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        className="peer appearance-none w-5 h-5 border border-primary-100/50 rounded-sm checked:bg-primary-500 checked:border-primary-500 transition-all"
                                    />
                                    <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                </div>
                                <span className="text-primary-100/80 group-hover:text-white transition-colors">
                                    {category.name}
                                </span>
                            </label>
                        </div>
                    ))}
                </div>
            </div>
        </Drawer>
    );
}
