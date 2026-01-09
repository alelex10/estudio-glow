import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import React from "react";
import { queryClient } from "./common/config/query-client";

interface RootLoaderData {
  children: React.ReactNode;
}

export function Layout({ children }: RootLoaderData) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="font-gabarito">
        <QueryClientProvider client={queryClient}>
          {children}
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <>
      <Outlet />
    </>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  // Error personalizado para conexión a API
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('fetch failed') ||
        error.cause instanceof Error && error.cause.message.includes('ECONNREFUSED')) {
      
      return (
        <main className="pt-16 p-4 container mx-auto">
          <div className="max-w-2xl mx-auto mt-20 text-center">
            <div className="text-8xl mb-6">✨</div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-primary-800 mb-6">
              Glow Studio
            </h1>
            <h2 className="text-2xl md:text-3xl font-semibold text-primary-600 mb-4">
              Estamos actualizando nuestro catálogo
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Nuestro equipo está trabajando para mostrarte los mejores productos. 
              Por favor, vuelve a intentarlo en unos momentos.
            </p>
            
            <div className="bg-primary-50 p-6 rounded-xl mb-8">
              <h3 className="font-semibold text-primary-800 mb-3">¿Necesitas ayuda ahora?</h3>
              <div className="space-y-2 text-primary-700">
                <p>📧 Escríbenos a: <span className="font-medium">hola@glowstudio.com</span></p>
                <p>📱 Llámanos: <span className="font-medium">+1 234 567 890</span></p>
                <p>🕐 Horario: Lun-Sáb 10am-8pm</p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={() => window.location.reload()} 
                className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              >
                Intentar ahora
              </button>
              <button 
                onClick={() => window.location.href = '/'} 
                className="border-2 border-primary-600 text-primary-600 px-8 py-3 rounded-lg hover:bg-primary-50 transition-colors font-medium"
              >
                Página principal
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-8">
              Disculpa las molestias. Volveremos pronto con más belleza para ti. 💖
            </p>
          </div>
        </main>
      );
    }
  }

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
