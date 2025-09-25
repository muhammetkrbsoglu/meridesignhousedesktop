import React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

interface ReactQueryProviderProps {
  children: React.ReactNode
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Global query configuration
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false
        }
        // Retry up to 3 times for other errors
        return failureCount < 3
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
    },
    mutations: {
      // Global mutation configuration
      retry: 1,
      retryDelay: 1000,
    },
  },
})

export function ReactQueryProvider({ children }: ReactQueryProviderProps) {
  // Show Devtools ONLY in development builds
  const runtimeEnv = (globalThis as any)?.mdh?.env?.VITE_ENVIRONMENT
  const viteMode = (import.meta as any)?.env?.MODE
  const viteDev = (import.meta as any)?.env?.DEV === true
  const isDev = runtimeEnv === 'development' || viteMode === 'development' || viteDev

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {isDev && (
        <ReactQueryDevtools
          initialIsOpen={false}
        />
      )}
    </QueryClientProvider>
  )
}
