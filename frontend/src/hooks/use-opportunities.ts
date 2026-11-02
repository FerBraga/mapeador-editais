import { useQuery } from '@tanstack/react-query'
import { fetchOpportunities, fetchOpportunity, shouldRetryQuery } from '@/lib/api'
import type { OpportunityListFilters } from '@/types/api'

export function useOpportunities(filters: OpportunityListFilters) {
  return useQuery({
    queryKey: ['opportunities', filters],
    queryFn: () => fetchOpportunities(filters),
    retry: shouldRetryQuery,
  })
}

export function useOpportunity(id: string | undefined) {
  return useQuery({
    queryKey: ['opportunity', id],
    queryFn: () => fetchOpportunity(id as string),
    enabled: Boolean(id),
    retry: shouldRetryQuery,
  })
}
