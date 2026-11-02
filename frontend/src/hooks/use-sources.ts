import { useQuery } from '@tanstack/react-query'
import { fetchSources, shouldRetryQuery } from '@/lib/api'

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: fetchSources,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetryQuery,
  })
}
