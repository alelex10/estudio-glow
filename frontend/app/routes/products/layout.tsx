import { Await, Outlet, useLoaderData } from "react-router";
import { Button } from "~/common/components/Button";
import { SlidersHorizontal, ChevronDown } from "lucide-react";
import clsx from "clsx";
import { Suspense, useState } from "react";
import { FilterDrawer } from "./components/FilterDrawer";
import { productService } from "~/common/services/productService";
import { isRouteErrorResponse } from "react-router";
import { queryOptions } from "@tanstack/react-query";
import type { Route } from "./+types/layout";
import { FilterSideBar } from "./components/FilterSideBar";
import Footer from "~/common/components/Footer";
import Popover from "~/common/components/Popover";
import { queryClient } from "~/common/config/query-client";

const categoryListQuery = () =>
  queryOptions({
    queryKey: ["categories"],
    queryFn: () => productService.getCategories(),
  });

export const loader = async () => {
  const categoriesData = await queryClient.ensureQueryData(categoryListQuery());
  return { categories: categoriesData.data };
};

// export async function loader() {
//   try {
//     const categories = await productService.getCategories();
//     return { categories: categories.data };
//   } catch (error) {
//     throw data("Error loading categories", { status: 500 });
//   }
// }

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mt-20">
        <h1 className="text-2xl font-bold text-red-600">
          {error.status} {error.statusText}
        </h1>
        <p className="text-gray-600">{error.data}</p>
      </div>
    );
  } else if (error instanceof Error) {
    return (
      <div className="p-4">
        <h1 className="text-2xl font-bold text-red-600">Error</h1>
        <p className="text-gray-600">{error.message}</p>
        <p className="text-gray-500 mt-2">The stack trace is:</p>
        <pre className="text-sm text-gray-400 mt-1 whitespace-pre-wrap">
          {error.stack}
        </pre>
      </div>
    );
  } else {
    return <h1 className="p-4">Unknown Error</h1>;
  }
}

export default function ProductsLayout({ loaderData }: Route.ComponentProps) {
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [filter, setFilter] = useState({ sortBy: "name", sortOrder: "asc" });
  const { categories } = loaderData;

  const SORT_OPTIONS = [
    { label: "Precio: Menor a Mayor", sortBy: "price", sortOrder: "asc" },
    { label: "Precio: Mayor a Menor", sortBy: "price", sortOrder: "desc" },
    { label: "Nombre: A a Z", sortBy: "name", sortOrder: "asc" },
    { label: "Nombre: Z a A", sortBy: "name", sortOrder: "desc" },
  ];

  const handleSort = (sortBy: string, sortOrder: string) => {
    setFilter({ sortBy, sortOrder });
    setIsSortOpen(false);
  };

  return (
    <>
      <main className="min-h-screen">
        <div className="flex gap-2 mb-8 justify-center md:justify-end pt-24 px-4">
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
            className="md:w-fit"
          >
            {isSortOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-primary-100 py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                {SORT_OPTIONS.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleSort(option.sortBy, option.sortOrder)}
                    className={clsx(
                      "w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-primary-50",
                      filter.sortBy === option.sortBy &&
                        filter.sortOrder === option.sortOrder
                        ? "text-primary-600 font-medium bg-primary-50"
                        : "text-gray-600"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </Popover>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
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

      {/* <Footer className="mt-20" /> */}
    </>
  );
}
