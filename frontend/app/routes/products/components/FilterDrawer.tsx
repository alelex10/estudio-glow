import { useState } from "react";
import Drawer from "~/common/components/Drawer";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import clsx from "clsx";
import { CATEGORIES } from "./data";

interface FilterDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}


export function FilterDrawer({ isOpen, onClose }: FilterDrawerProps) {
    const [expandedCategories, setExpandedCategories] = useState<string[]>(["category"]);

    const toggleCategory = (id: string) => {
        setExpandedCategories(prev =>
            prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
        );
    };

    return (
        <Drawer isOpen={isOpen} onClose={onClose} >
            <div className="flex flex-col h-full text-primary-100">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-playfair tracking-wide">Filters</h2>
                </div>

                <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                    {CATEGORIES.map((category) => (
                        <div key={category.id} className="border-b border-primary-100/20 pb-4">
                            <button
                                onClick={() => toggleCategory(category.id)}
                                className="flex items-center justify-between w-full text-left mb-4 hover:text-white transition-colors"
                            >
                                <span className="text-lg font-medium tracking-wide">{category.name}</span>
                                {expandedCategories.includes(category.id) ? (
                                    <ChevronUp size={20} />
                                ) : (
                                    <ChevronDown size={20} />
                                )}
                            </button>

                            <div
                                className={clsx(
                                    "space-y-3 overflow-hidden transition-all duration-300 ease-in-out",
                                    expandedCategories.includes(category.id) ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                {category.options.map((option) => (
                                    <label key={option} className="flex items-center gap-3 cursor-pointer group">
                                        <div className="relative flex items-center">
                                            <input
                                                type="checkbox"
                                                className="peer appearance-none w-5 h-5 border border-primary-100/50 rounded-sm checked:bg-primary-500 checked:border-primary-500 transition-all"
                                            />
                                            <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" />
                                        </div>
                                        <span className="text-primary-100/80 group-hover:text-white transition-colors">
                                            {option}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-auto pt-6 border-t border-primary-100/20 flex gap-4">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 border border-primary-100/30 text-primary-100 hover:bg-primary-100/10 transition-colors uppercase tracking-wider text-sm font-medium"
                    >
                        Clear All
                    </button>
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 px-4 bg-primary-500 text-white hover:bg-primary-600 transition-colors uppercase tracking-wider text-sm font-medium shadow-lg"
                    >
                        Apply
                    </button>
                </div>
            </div>
        </Drawer>
    );
}
