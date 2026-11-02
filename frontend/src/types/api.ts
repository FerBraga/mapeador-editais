export type OpportunityStatus = 'OPEN' | 'UPCOMING' | 'CLOSED' | 'SUSPENDED' | 'CANCELLED' | 'UNKNOWN'

export type RequiredDocumentCategory = 'LEGAL' | 'TAX' | 'FINANCIAL' | 'TECHNICAL' | 'DECLARATION' | 'OTHER'

export interface CategoryRef {
  id: string
  name: string
  slug: string
}

export interface SourceRef {
  id: string
  name: string
}

export interface MunicipalityRef {
  id: string
  name: string
  latitude: number | null
  longitude: number | null
}

export interface OpportunitySummary {
  id: string
  title: string
  slug: string
  issuingOrganization: string | null
  officialUrl: string
  status: OpportunityStatus
  fundingMin: number | null
  fundingMax: number | null
  registrationStartAt: string | null
  registrationEndAt: string | null
  publishedAt: string | null
  coversEntireState: boolean
  category: CategoryRef | null
  source: SourceRef
  municipalities: MunicipalityRef[]
}

export interface RequiredDocument {
  id: string
  name: string
  description: string | null
  documentCategory: RequiredDocumentCategory
  isMandatory: boolean
  evidence: string | null
  sourcePage: number | null
}

export interface LatestAnalysis {
  id: string
  model: string
  promptVersion: string
  summary: string | null
  structuredResult: unknown
  tokensInput: number | null
  tokensOutput: number | null
  createdAt: string
}

export interface OpportunityDetail extends OpportunitySummary {
  description: string | null
  object: string | null
  noticeNumber: string | null
  requiredDocuments: RequiredDocument[]
  latestAnalysis: LatestAnalysis | null
}

export interface PaginationMeta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export interface OpportunityListResponse {
  data: OpportunitySummary[]
  meta: PaginationMeta
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
}

export interface Source {
  id: string
  name: string
  baseUrl: string
  sourceType: string
  isActive: boolean
}

export interface Municipality {
  id: string
  name: string
  ibgeCode: string
  latitude: number
  longitude: number
  opportunityCount: number
}

export interface ApiErrorResponse {
  statusCode: number
  error: string
  message: string | Array<{ path: Array<string | number>; message: string }>
  path: string
  timestamp: string
}

export interface OpportunityListFilters {
  page?: number
  pageSize?: number
  municipalityId?: string
  categoryId?: string
  sourceId?: string
  status?: OpportunityStatus
  onlyOpen?: boolean
  fundingMin?: number
  fundingMax?: number
  q?: string
}
