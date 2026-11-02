function toNumberOrNull(value: unknown): number | null {
  return value === null || value === undefined ? null : Number(value);
}

interface MunicipalityLite {
  id: string;
  name: string;
  latitude: unknown;
  longitude: unknown;
}

interface MunicipalityLinkLite {
  municipality: MunicipalityLite;
}

interface CategoryLite {
  id: string;
  name: string;
  slug: string;
}

interface SourceLite {
  id: string;
  name: string;
}

interface RequiredDocumentLite {
  id: string;
  name: string;
  description: string | null;
  documentCategory: string;
  isMandatory: boolean;
  evidence: string | null;
  sourcePage: number | null;
}

interface AiAnalysisLite {
  id: string;
  model: string;
  promptVersion: string;
  summary: string | null;
  structuredResult: unknown;
  tokensInput: number | null;
  tokensOutput: number | null;
  createdAt: Date;
}

export interface OpportunitySummarySource {
  id: string;
  title: string;
  slug: string;
  issuingOrganization: string | null;
  officialUrl: string;
  status: string;
  fundingMin: unknown;
  fundingMax: unknown;
  registrationStartAt: Date | null;
  registrationEndAt: Date | null;
  publishedAt: Date | null;
  coversEntireState: boolean;
  category: CategoryLite | null;
  source: SourceLite;
  municipalityLinks: MunicipalityLinkLite[];
}

export interface OpportunityDetailSource extends OpportunitySummarySource {
  description: string | null;
  object: string | null;
  noticeNumber: string | null;
  requiredDocuments: RequiredDocumentLite[];
  aiAnalyses: AiAnalysisLite[];
}

function toMunicipalitySummary(link: MunicipalityLinkLite) {
  const m = link.municipality;
  return {
    id: m.id,
    name: m.name,
    latitude: toNumberOrNull(m.latitude),
    longitude: toNumberOrNull(m.longitude),
  };
}

export function toOpportunitySummary(opportunity: OpportunitySummarySource) {
  return {
    id: opportunity.id,
    title: opportunity.title,
    slug: opportunity.slug,
    issuingOrganization: opportunity.issuingOrganization,
    officialUrl: opportunity.officialUrl,
    status: opportunity.status,
    fundingMin: toNumberOrNull(opportunity.fundingMin),
    fundingMax: toNumberOrNull(opportunity.fundingMax),
    registrationStartAt: opportunity.registrationStartAt,
    registrationEndAt: opportunity.registrationEndAt,
    publishedAt: opportunity.publishedAt,
    coversEntireState: opportunity.coversEntireState,
    category: opportunity.category
      ? {
          id: opportunity.category.id,
          name: opportunity.category.name,
          slug: opportunity.category.slug,
        }
      : null,
    source: { id: opportunity.source.id, name: opportunity.source.name },
    municipalities: opportunity.municipalityLinks.map(toMunicipalitySummary),
  };
}

export function toOpportunityDetail(opportunity: OpportunityDetailSource) {
  const latestAnalysis = opportunity.aiAnalyses[0] ?? null;

  return {
    ...toOpportunitySummary(opportunity),
    description: opportunity.description,
    object: opportunity.object,
    noticeNumber: opportunity.noticeNumber,
    requiredDocuments: opportunity.requiredDocuments.map((doc) => ({
      id: doc.id,
      name: doc.name,
      description: doc.description,
      documentCategory: doc.documentCategory,
      isMandatory: doc.isMandatory,
      evidence: doc.evidence,
      sourcePage: doc.sourcePage,
    })),
    latestAnalysis: latestAnalysis
      ? {
          id: latestAnalysis.id,
          model: latestAnalysis.model,
          promptVersion: latestAnalysis.promptVersion,
          summary: latestAnalysis.summary,
          structuredResult: latestAnalysis.structuredResult,
          tokensInput: latestAnalysis.tokensInput,
          tokensOutput: latestAnalysis.tokensOutput,
          createdAt: latestAnalysis.createdAt,
        }
      : null,
  };
}
