import { useSearchParams } from "react-router";
import { Check, Search, SlidersHorizontal, ChevronDown } from "lucide-react";
import clsx from "clsx";
import type { Category } from "~/common/types/product-types";
import { useState, useEffect } from "react";

const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background-color: rgba(var(--color-primary-300-rgb, 251 176 160), 0.5);
    border-radius: 20px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background-color: rgba(var(--color-primary-400-rgb, 248 144 121), 0.7);
  }
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--color-primary-300-rgb, 251 176 160), 0.5) transparent;
  }
`;

interface Props {
    categories: Category[];
}

const STOCK_OPTIONS = [
    { value: "ok", label: "Disponible (>10 unidades)" },
    { value: "low", label: "Stock Bajo (≤10 unidades)" },
    { value: "out", label: "Sin Stock (=0 unidades)" },
];

export function FilterSideBar({ categories }: Props) {
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
        <>
            <style>{scrollbarStyles}</style>
            <div className="sticky top-24 flex flex-col min-w-[280px] max-h-[calc(100vh-8rem)] overflow-y-auto px-6 py-8 bg-white/80 backdrop-blur-sm rounded-2xl custom-scrollbar">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-primary-600/20">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary-100 rounded-lg">
                        <SlidersHorizontal className="w-5 h-5 text-primary-600" />
                    </div>
                    <h2 className="text-2xl font-el-messiri font-semibold text-primary-900">
                        Filtros
                    </h2>
                </div>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-sm text-primary-600/70 hover:text-primary-600 transition-colors duration-200 font-medium"
                    >
                        Limpiar todo
                    </button>
                )}
            </div>

            {/* Búsqueda */}
            <div className="space-y-4 mb-8">
                <h3 className="text-sm font-el-messiri font-semibold text-primary-600/80 uppercase tracking-wider">
                    Buscar
                </h3>
                <div className="relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-600/40 group-focus-within:text-primary-500 transition-colors duration-200" />
                    <input
                        type="text"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                        onBlur={applySearch}
                        onKeyDown={(e) => e.key === "Enter" && applySearch()}
                        placeholder="Nombre del producto..."
                        className="w-full pl-11 pr-4 py-3 bg-primary-50/50 border border-primary-600/20 rounded-xl text-primary-900 placeholder:text-primary-600/30 focus:outline-none focus:border-primary-500/50 focus:bg-primary-50/80 focus:ring-1 focus:ring-primary-500/30 transition-all duration-200"
                    />
                </div>
            </div>

            {/* Categorías */}
            {categories.length > 0 && (
                <div className="space-y-2 mb-6">
                    <button
                        onClick={() => setIsCategoriesOpen(!isCategoriesOpen)}
                        className="w-full flex items-center justify-between py-2 group"
                    >
                        <h3 className="text-sm font-el-messiri font-semibold text-primary-600/80 uppercase tracking-wider">
                            Categorías
                        </h3>
                        <ChevronDown className={clsx(
                            "w-4 h-4 text-primary-600/60 transition-transform duration-300",
                            isCategoriesOpen && "rotate-180"
                        )} />
                    </button>
                    <div className={clsx(
                        "space-y-1 overflow-hidden transition-all duration-300 ease-out",
                        isCategoriesOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                    )}>
                        {categories.map((category, index) => (
                            <label
                                key={`sidebar-cat-${category.id}-${index}`}
                                className="flex items-center gap-3 p-2 -mx-2 rounded-lg cursor-pointer group hover:bg-primary-100/50 transition-colors duration-200"
                            >
                                <div className="relative flex items-center">
                                    <input
                                        type="radio"
                                        name="category"
                                        checked={effectiveCategoryId === category.id}
                                        onChange={() => handleCategoryChange(category.id)}
                                        className="peer appearance-none w-5 h-5 border-2 border-primary-600/30 rounded-md checked:bg-primary-500 checked:border-primary-500 transition-all duration-200"
                                    />
                                    <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" />
                                </div>
                                <span className="text-primary-700/70 group-hover:text-primary-700 transition-colors duration-200 font-medium">
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
                    <h3 className="text-sm font-el-messiri font-semibold text-primary-600/80 uppercase tracking-wider">
                        Disponibilidad
                    </h3>
                    <ChevronDown className={clsx(
                        "w-4 h-4 text-primary-600/60 transition-transform duration-300",
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
                            className="flex items-center gap-3 p-2 -mx-2 rounded-lg cursor-pointer group hover:bg-primary-100/50 transition-colors duration-200"
                        >
                            <div className="relative flex items-center">
                                <input
                                    type="radio"
                                    name="stock"
                                    checked={currentStock === option.value}
                                    onChange={() => handleStockChange(option.value)}
                                    className="peer appearance-none w-5 h-5 border-2 border-primary-600/30 rounded-md checked:bg-primary-500 checked:border-primary-500 transition-all duration-200"
                                />
                                <Check className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity duration-200" />
                            </div>
                            <span className="text-primary-700/70 group-hover:text-primary-700 transition-colors duration-200 font-medium">
                                {option.label}
                            </span>
                        </label>
                    ))}
                </div>
            </div>
        </div>
        </>
    );
}
