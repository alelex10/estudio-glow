import { Await, Outlet, useLoaderData, useSearchParams } from "react-router";
import { Button } from "~/common/components/button/Button";
import { SlidersHorizontal, ChevronDown, Search } from "lucide-react";
import clsx from "clsx";
import { Suspense, useState, useEffect, useCallback } from "react";
import { FilterDrawer } from "../../common/components/product-filter/FilterDrawer";
import { productService } from "~/common/services/productService";
import { isRouteErrorResponse } from "react-router";
import { data } from "react-router";
import type { Route } from "./+types/layout";
import { FilterSideBar } from "../../common/components/product-filter/FilterSideBar";
import Footer from "~/common/components/Footer";
import Popover from "~/common/components/Popover";
import ProductCardSkeleton from "~/common/components/ProductCardSkeleton";

export async function loader() {
  try {
    const categories = await productService.getCategories();
    return { categories: categories.data };
  } catch (error) {
    throw data("Error loading categories", { status: 500 });
  }
}

export default function ProductsLayout({ loaderData }: Route.ComponentProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");

  // Sync searchInput to URL params on change from outside (e.g. FilterDrawer)
  useEffect(() => {
    setSearchInput(searchParams.get("q") || "");
  }, [searchParams]);

  const currentSortBy = searchParams.get("sortBy") || "name";
  const currentSortOrder = searchParams.get("sortOrder") || "asc";

  const { categories } = loaderData;

  const SORT_OPTIONS = [
    { label: "Precio: Menor a Mayor", sortBy: "price", sortOrder: "asc" },
    { label: "Precio: Mayor a Menor", sortBy: "price", sortOrder: "desc" },
    { label: "Nombre: A a Z", sortBy: "name", sortOrder: "asc" },
    { label: "Nombre: Z a A", sortBy: "name", sortOrder: "desc" },
  ];

  const handleSort = (sortBy: string, sortOrder: string) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("sortBy", sortBy);
    newParams.set("sortOrder", sortOrder);
    setSearchParams(newParams, { replace: true });
    setIsSortOpen(false);
  };

  const handleSearch = useCallback(
    (q: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (q) {
        newParams.set("q", q);
      } else {
        newParams.delete("q");
      }
      newParams.set("page", "1"); // Reset page on new search
      setSearchParams(newParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  return (
    <>
      <main className="min-h-screen">
        <div className="mb-8 pt-24 px-4">
          {/* Mobile: full-width search bar */}
          <div className="md:hidden relative w-full mb-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSearch(searchInput);
                }
              }}
              onBlur={(e) => {
                const currentQ = searchParams.get("q") || "";
                if (e.target.value !== currentQ) {
                  handleSearch(e.target.value);
                }
              }}
              placeholder="Buscar..."
              className="w-full pl-9 pr-3 py-2 text-sm border border-primary-400 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-300 focus:border-primary-500 transition-colors"
            />
          </div>

          {/* Filters + Sort row */}
          <div className="flex gap-2 justify-center md:justify-end">
            <Button
              onClick={() => setIsFilterOpen(true)}
              variant="outline"
              className="md:hidden"
            >
              <SlidersHorizontal size={18} />
              Filtros
            </Button>

            <Popover
              isOpen={isSortOpen}
              setIsOpen={setIsSortOpen}
              text="Ordenar"
            >
              {isSortOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-primary-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                  {SORT_OPTIONS.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleSort(option.sortBy, option.sortOrder)}
                      className={clsx(
                        "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-primary-50",
                        currentSortBy === option.sortBy &&
                          currentSortOrder === option.sortOrder
                          ? "text-primary-600 font-medium bg-primary-50"
                          : "text-gray-600",
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </Popover>
          </div>
        </div>
        <Suspense
          fallback={
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 w-full max-w-7xl mx-auto px-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          }
        >
          <Await resolve={categories}>
            <div className="flex gap-4 w-full justify-center">
              <div className="hidden md:block">
                <FilterSideBar categories={categories || []} />
              </div>
              <Outlet />
            </div>

            <div className="md:hidden">
              <FilterDrawer
                categories={categories || []}
                isOpen={isFilterOpen}
                onClose={() => setIsFilterOpen(false)}
              />
            </div>
          </Await>
        </Suspense>
      </main>

      <Footer className="mt-20" />
    </>
  );
}
