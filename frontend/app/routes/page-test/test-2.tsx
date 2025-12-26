import { testService } from "~/common/services/testService";
import type { Route } from "./+types/test-2";
import { Suspense } from "react";
import { Await } from "react-router";

export async function loader() {
  const test = await testService.getTest();
  return test;
}
export default function Test({ loaderData }: Route.ComponentProps) {
  const test = loaderData;
  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-100 p-8">
      <Await resolve={test}>{(test) => <h1>{test?.message}</h1>}</Await>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <div className="h-48 bg-indigo-200 flex items-center justify-center">
                <span className="text-indigo-500 text-4xl">📊</span>
              </div>
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Elemento {index + 1}
                </h2>
                <p className="text-gray-600">
                  Este es un elemento de prueba estático para medir el
                  rendimiento de la página.
                </p>
                <div className="mt-4 flex justify-between items-center">
                  <span className="text-sm text-indigo-600">#{index + 1}</span>
                  <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
                    Ver más
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
