import { useSearchParams } from "react-router";
import Drawer from "~/common/components/Drawer";
import { Check, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { Category } from "~/common/types/product-types";
import { useState, useEffect } from "react";

interface Props {
    categories: Category[];
    isOpen: boolean;
    onClose: () => void;
}

const STOCK_OPTIONS = [
    { value: "ok", label: "Disponible (>10 unidades)" },
    { value: "low", label: "Stock Bajo (≤10 unidades)" },
    { value: "out", label: "Sin Stock (=0 unidades)" },
];

export function FilterDrawer({ categories, isOpen, onClose }: Props) {
    const [searchParams, setSearchParams] = useSearchParams();

    const currentCategoryId = searchParams.get("categoryId") || "";
    const currentStock = (searchParams.get("stock") as "low" | "out" | "ok" | "") || "";
    const currentSearch = searchParams.get("q") || "";

    const [searchInput, setSearchInput] = useState(currentSearch);

    const [isCategoriesOpen, setIsCategoriesOpen] = useState(true);
    const [isStockOpen, setIsStockOpen] = useState(true);

    const applySearch = () => {
        const newParams = new URLSearchParams(searchParams);

        if (searchInput) {
            newParams.set("q", searchInput);
        } else {
            newParams.delete("q");
        }

        setSearchParams(newParams, { replace: true });
    };

    const clearSearch = () => {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("q");
        setSearchParams(newParams, { replace: true });
        setSearchInput("");
    };

    const [optimisticCategoryId, setOptimisticCategoryId] = useState<string | null>(null);

    useEffect(() => {
        setOptimisticCategoryId(null);
    }, [currentCategoryId]);

    const effectiveCategoryId = optimisticCategoryId ?? currentCategoryId;

    const handleCategoryChange = (categoryId: string) => {
        const newParams = new URLSearchParams(searchParams);

        if (effectiveCategoryId === categoryId) {
            newParams.delete("categoryId");
            newParams.delete("category");
            setOptimisticCategoryId(null);
        } else {
            newParams.set("categoryId", categoryId);
            newParams.delete("category");
            setOptimisticCategoryId(categoryId);
        }

        setSearchParams(newParams, { replace: true });
    };

    const handleStockChange = (stock: string) => {
        const newParams = new URLSearchParams(searchParams);

        if (currentStock === stock) {
            newParams.delete("stock");
        } else {
            newParams.set("stock", stock);
        }

        setSearchParams(newParams, { replace: true });
    };

    const clearFilters = () => {
        const newParams = new URLSearchParams();
        const sortBy = searchParams.get("sortBy");
        const sortOrder = searchParams.get("sortOrder");
        if (sortBy) newParams.set("sortBy", sortBy);
        if (sortOrder) newParams.set("sortOrder", sortOrder);

        setSearchParams(newParams, { replace: true });
        setSearchInput("");
    };

    const hasActiveFilters = effectiveCategoryId || currentStock || currentSearch;

    return (
        <Drawer isOpen={isOpen} onClose={onClose}>
            <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-primary-100/10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-500/20 rounded-lg">
                            <SlidersHorizontal className="w-5 h-5 text-primary-200" />
                        </div>
                        <h2 className="text-2xl font-el-messiri font-semibold text-primary-100">
                            Filtros
                        </h2>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-sm text-primary-200/70 hover:text-primary-200 transition-colors duration-200 font-medium"
                        >
                            Limpiar todo
                        </button>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto space-y-8 pr-2">
                    {/* Búsqueda */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-el-messiri font-semibold text-primary-200/80 uppercase tracking-wider">
                            Buscar
                        </h3>
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-100/40 group-focus-within:text-primary-200 transition-colors duration-200" />
                            <input
                                type="text"
                                value={searchInput}
                                onChange={(e) => setSearchInput(e.target.value)}
                                onBlur={applySearch}
                                onKeyDown={(e) => e.key === "Enter" && applySearch()}
                                placeholder="Nombre del producto..."
                                className="w-full pl-11 pr-4 py-3 bg-primary-800/50 border border-primary-100/20 rounded-xl text-primary-100 placeholder:text-primary-100/30 focus:outline-none focus:border-primary-400/50 focus:bg-primary-800/80 focus:ring-1 focus:ring-primary-400/30 transition-all duration-200"
                            />
                        </div>
                    </div>

                    {/* Categorías */}
                    {categories.length > 0 && (
                        <div className="space-y-2">
                            <button
                                onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                                className="w-full flex items-center justify-between py-2 group"
                            >
                                <h3 className="text-sm font-el-messiri font-semibold text-primary-200/80 uppercase tracking-wider">
                                    Categorías
                                </h3>
                                <ChevronDown className={clsx(
                                    "w-4 h-4 text-primary-200/60 transition-transform duration-300",
                                    isCategoriesOpen && "rotate-180"
                                )} />
                            </button>
                            <div className={clsx(
                                "space-y-1 overflow-hidden transition-all duration-300 ease-out",
                                isCategoriesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                            )}>
                                {categories.map((category, index) => (
                                    <label
                                        key={`drawer-cat-${category.id}-${index}`}
                                        className="flex items-center gap-3 p-2 -mx-2 rounded-lg cursor-pointer group hover:bg-primary-800/40 transition-colors duration-200"
                                    >
                                        <div className="relative flex items-center">
                                            <input
                                                type="radio"
                                                name="category"
                                                checked={effectiveCategoryId === category.id}
                                                onChange={() => handleCategoryChange(category.id)}
                                                className={clsx(
                                                    "peer appearance-none w-5 h-5 border-2 border-primary-100/30 rounded-md checked:bg-primary-500 checked:border-primary-400 transition-all duration-200"
                                                )}
                                            />
                                            <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-primary-900 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" />
                                        </div>
                                        <span className="text-primary-100/70 group-hover:text-primary-100 transition-colors duration-200 font-medium">
                                            {category.name}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Stock */}
                    <div className="space-y-2">
                        <button
                            onClick={() => setIsStockOpen(!isStockOpen)}
                            className="w-full flex items-center justify-between py-2 group"
                        >
                            <h3 className="text-sm font-el-messiri font-semibold text-primary-200/80 uppercase tracking-wider">
                                Disponibilidad
                            </h3>
                            <ChevronDown className={clsx(
                                "w-4 h-4 text-primary-200/60 transition-transform duration-300",
                                isStockOpen && "rotate-180"
                            )} />
                        </button>
                        <div className={clsx(
                            "space-y-1 overflow-hidden transition-all duration-300 ease-out",
                            isStockOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"
                        )}>
                            {STOCK_OPTIONS.map((option) => (
                                <label
                                    key={option.value}
                                    className="flex items-center gap-3 p-2 -mx-2 rounded-lg cursor-pointer group hover:bg-primary-800/40 transition-colors duration-200"
                                >
                                    <div className="relative flex items-center">
                                        <input
                                            type="radio"
                                            name="stock"
                                            checked={currentStock === option.value}
                                            onChange={() => handleStockChange(option.value)}
                                            className={clsx(
                                                "peer appearance-none w-5 h-5 border-2 border-primary-100/30 rounded-md checked:bg-primary-500 checked:border-primary-400 transition-all duration-200"
                                            )}
                                        />
                                        <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-primary-900 opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" />
                                    </div>
                                    <span className="text-primary-100/70 group-hover:text-primary-100 transition-colors duration-200 font-medium">
                                        {option.label}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Drawer>
    );
}
