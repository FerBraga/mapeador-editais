import { useQuery } from '@tanstack/react-query'
import { fetchMunicipalities, shouldRetryQuery } from '@/lib/api'

export function useMunicipalities() {
  return useQuery({
    queryKey: ['municipalities'],
    queryFn: fetchMunicipalities,
    staleTime: 60 * 1000,
    retry: shouldRetryQuery,
  })
}
