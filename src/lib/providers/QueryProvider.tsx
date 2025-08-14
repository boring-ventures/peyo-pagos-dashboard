"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 🚀 OPTIMIZACIONES CRÍTICAS
            staleTime: 15 * 60 * 1000,      // 15 minutos - datos considerados frescos
            gcTime: 30 * 60 * 1000,         // 30 minutos - tiempo antes de garbage collection
            refetchOnWindowFocus: false,     // ❌ No refetch al cambiar pestañas
            refetchOnReconnect: false,       // ❌ No refetch al reconectar internet
            refetchOnMount: false,           // ❌ Usar cache disponible al montar
            
            // Configuración de reintentos inteligente
            retry: (failureCount, error: any) => {
              // No reintentar errores de autenticación/autorización
              if (error?.status === 401 || error?.status === 403) {
                return false;
              }
              // Solo 2 reintentos para otros errores
              return failureCount < 2;
            },
            
            // Delay exponencial para reintentos
            retryDelay: (attemptIndex) =>
              Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            // Configuración de reintentos para mutations
            retry: (failureCount, error: any) => {
              // No reintentar errores 4xx (client errors)
              if (error?.status >= 400 && error?.status < 500) {
                return false;
              }
              // Solo 1 reintento para mutations
              return failureCount < 1;
            },
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}
