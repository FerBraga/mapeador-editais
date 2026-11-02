import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { OpportunityListFilters, OpportunityStatus } from '@/types/api'

function parseNumber(value: string | null): number | undefined {
  if (value === null || value === '') return undefined
  const parsed = Number(value)
  return Number.isNaN(parsed) ? undefined : parsed
}

function parseBoolean(value: string | null): boolean | undefined {
  if (value === 'true') return true
  if (value === 'false') return false
  return undefined
}

/**
 * Reads/writes opportunity filters directly from the URL query string, so
 * searches are shareable by link and navigable via the browser's history.
 */
export function useOpportunityFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters: OpportunityListFilters = useMemo(
    () => ({
      page: parseNumber(searchParams.get('page')) ?? 1,
      pageSize: parseNumber(searchParams.get('pageSize')) ?? 20,
      municipalityId: searchParams.get('municipalityId') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      sourceId: searchParams.get('sourceId') ?? undefined,
      status: (searchParams.get('status') as OpportunityStatus | null) ?? undefined,
      onlyOpen: parseBoolean(searchParams.get('onlyOpen')),
      fundingMin: parseNumber(searchParams.get('fundingMin')),
      fundingMax: parseNumber(searchParams.get('fundingMax')),
      q: searchParams.get('q') ?? undefined,
    }),
    [searchParams],
  )

  const setFilters = useCallback(
    (patch: Partial<OpportunityListFilters>, options: { resetPage?: boolean } = {}) => {
      setSearchParams((previous) => {
        const next = new URLSearchParams(previous)
        for (const [key, value] of Object.entries(patch)) {
          if (value === undefined || value === null || value === '') {
            next.delete(key)
          } else {
            next.set(key, String(value))
          }
        }
        if (options.resetPage ?? true) {
          next.delete('page')
        }
        return next
      })
    },
    [setSearchParams],
  )

  const setPage = useCallback(
    (page: number) => {
      setFilters({ page }, { resetPage: false })
    },
    [setFilters],
  )

  return { filters, setFilters, setPage }
}
