import { QueryClient } from "@tanstack/react-query";

/**
 * Configuración del QueryClient para React Query
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Tiempo que los datos se consideran frescos (5 minutos)
      staleTime: Infinity,
      // Tiempo que los datos se mantienen en cache (10 minutos)
      gcTime: 10 * 60 * 1000,
      // Reintentar peticiones fallidas
      retry: 1,
      // Refetch cuando la ventana recupera el foco
      refetchOnWindowFocus: false,
      // Refetch cuando se reconecta a internet
      refetchOnReconnect: true,
    },
    mutations: {
      // Reintentar mutaciones fallidas
      retry: 0,
    },
  },
});

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (!browserQueryClient) {
    browserQueryClient = new QueryClient({
      defaultOptions: {
        queries: {
          staleTime: Infinity,
          refetchOnWindowFocus: false,
          refetchOnReconnect: false,
          retry: false,
          gcTime: 10 * 60 * 1000,
        },
      },
    });
  }

  return browserQueryClient;
}
