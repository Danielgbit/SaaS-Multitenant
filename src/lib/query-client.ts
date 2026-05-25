import { QueryClient } from '@tanstack/react-query'

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
        gcTime: 5 * 60 * 1000,
        networkMode: 'online',
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
        structuralSharing: true,
        retry: 2,
        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

export function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}
