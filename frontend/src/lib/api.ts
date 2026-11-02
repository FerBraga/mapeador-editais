import type {
  ApiErrorResponse,
  Category,
  Municipality,
  OpportunityDetail,
  OpportunityListFilters,
  OpportunityListResponse,
  Source,
} from '@/types/api'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1'

export type HealthResponse = {
  status: 'ok' | 'error'
  database: 'ok' | 'error'
  timestamp: string
}

/**
 * 4xx responses (not found, bad request) never succeed on retry - only
 * retry network errors / 5xx, and only a couple of times.
 */
export function shouldRetryQuery(failureCount: number, error: Error): boolean {
  if (error instanceof ApiError && error.statusCode < 500) return false
  return failureCount < 2
}

export class ApiError extends Error {
  readonly statusCode: number

  constructor(message: string, statusCode: number) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
  }
}

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`)
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorResponse | null
    const message = body
      ? Array.isArray(body.message)
        ? body.message.map((issue) => issue.message).join(', ')
        : body.message
      : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }
  return response.json()
}

function buildQueryString(filters: OpportunityListFilters): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value))
    }
  }
  const query = params.toString()
  return query ? `?${query}` : ''
}

export async function fetchHealth(): Promise<HealthResponse> {
  return request<HealthResponse>('/health')
}

export async function fetchOpportunities(filters: OpportunityListFilters = {}): Promise<OpportunityListResponse> {
  return request<OpportunityListResponse>(`/opportunities${buildQueryString(filters)}`)
}

export async function fetchOpportunity(id: string): Promise<OpportunityDetail> {
  return request<OpportunityDetail>(`/opportunities/${id}`)
}

export async function fetchCategories(): Promise<Category[]> {
  return request<Category[]>('/categories')
}

export async function fetchSources(): Promise<Source[]> {
  return request<Source[]>('/sources')
}

export async function fetchMunicipalities(): Promise<Municipality[]> {
  return request<Municipality[]>('/municipalities')
}
