import type {
  ApiErrorResponse,
  AuthResponse,
  AuthUser,
  Category,
  LoginPayload,
  Municipality,
  OpportunityDetail,
  OpportunityListFilters,
  OpportunityListResponse,
  ProjectDraftQuestionEntry,
  ProjectDraftSectionKey,
  ProjectDraftSectionState,
  ProjectDraftState,
  RegisterPayload,
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

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT'
  body?: unknown
  /** When set, attached as `Authorization: Bearer <token>` for authenticated endpoints. */
  token?: string
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    // Skips the free-tier ngrok interstitial warning page, which would
    // otherwise return HTML instead of the JSON every caller here expects.
    'ngrok-skip-browser-warning': 'true',
  }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'
  if (options.token) headers['Authorization'] = `Bearer ${options.token}`

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  })
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

export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/register', { method: 'POST', body: payload })
}

export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/login', { method: 'POST', body: payload })
}

export async function fetchMe(token: string): Promise<AuthUser | null> {
  return request<AuthUser | null>('/auth/me', { token })
}

export async function fetchProjectDraft(opportunityId: string, token: string): Promise<ProjectDraftState> {
  return request<ProjectDraftState>(`/project-drafts/${opportunityId}`, { token })
}

export async function submitProjectDraftSection(
  opportunityId: string,
  section: ProjectDraftSectionKey,
  answers: Record<string, string>,
  token: string,
): Promise<ProjectDraftSectionState> {
  return request<ProjectDraftSectionState>(`/project-drafts/${opportunityId}/sections/${section}`, {
    method: 'PUT',
    body: { answers },
    token,
  })
}

export async function regenerateProjectDraftSection(
  opportunityId: string,
  section: ProjectDraftSectionKey,
  token: string,
): Promise<ProjectDraftSectionState> {
  return request<ProjectDraftSectionState>(`/project-drafts/${opportunityId}/sections/${section}/regenerate`, {
    method: 'POST',
    token,
  })
}

export async function askProjectDraftQuestion(
  opportunityId: string,
  question: string,
  token: string,
): Promise<ProjectDraftQuestionEntry> {
  return request<ProjectDraftQuestionEntry>(`/project-drafts/${opportunityId}/questions`, {
    method: 'POST',
    body: { question },
    token,
  })
}
