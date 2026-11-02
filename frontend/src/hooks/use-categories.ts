import { useQuery } from '@tanstack/react-query'
import { fetchCategories, shouldRetryQuery } from '@/lib/api'

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
    staleTime: 5 * 60 * 1000,
    retry: shouldRetryQuery,
  })
}
