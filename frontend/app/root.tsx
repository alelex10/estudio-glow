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
import { ApiConnectionError, RouteError, DevError } from "./common/errors";

interface RootLoaderData {
  children: React.ReactNode;
}

async function loggingMiddleware(
  { request, context },
  next,
) {
  console.log(
    `${new Date().toISOString()} ${request.method} ${request.url}`,
  );
  const start = performance.now();
  const response = await next();
  const duration = performance.now() - start;
  console.log(
    `${new Date().toISOString()} Response ${response.status} (${duration}ms)`,
  );
  return response;
}

export const middleware = [loggingMiddleware];

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
  // Error personalizado para conexión a API
  if (error instanceof Error) {
    if (error.message.includes('ECONNREFUSED') || 
        error.message.includes('fetch failed') ||
        error.cause instanceof Error && error.cause.message.includes('ECONNREFUSED')) {
      return <ApiConnectionError />;
    }
  }

  // Error de ruta (404, etc.)
  if (isRouteErrorResponse(error)) {
    return <RouteError error={error} />;
  }

  // Error en desarrollo
  if (import.meta.env.DEV && error && error instanceof Error) {
    return <DevError error={error} />;
  }

  // Error genérico
  return <RouteError error={error} />;
}
