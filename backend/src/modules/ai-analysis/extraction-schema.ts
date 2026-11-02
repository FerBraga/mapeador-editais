import { z } from 'zod';

export const ExtractedRequiredDocumentCategorySchema = z.enum([
  'LEGAL',
  'TAX',
  'FINANCIAL',
  'TECHNICAL',
  'DECLARATION',
  'OTHER',
]);

export const ExtractedRequiredDocumentSchema = z.object({
  nome: z.string(),
  categoria: ExtractedRequiredDocumentCategorySchema,
  obrigatorio: z.boolean(),
  evidencia: z.string(),
  paginaAproximada: z.number().int().nullable(),
});

export const OpportunityExtractionSchema = z.object({
  titulo: z.string().nullable(),
  orgaoResponsavel: z.string().nullable(),
  objeto: z.string().nullable(),
  resumo: z.string().nullable(),
  publicoAlvo: z.string().nullable(),
  municipiosContemplados: z.array(z.string()),
  valorMinimo: z.number().nullable(),
  valorMaximo: z.number().nullable(),
  dataInicioInscricao: z.string().nullable(),
  dataFimInscricao: z.string().nullable(),
  criteriosElegibilidade: z.array(z.string()),
  restricoes: z.array(z.string()),
  etapasInscricao: z.array(z.string()),
  documentosExigidos: z.array(ExtractedRequiredDocumentSchema),
  ambiguidadesDetectadas: z.array(z.string()),
});

export type OpportunityExtraction = z.infer<typeof OpportunityExtractionSchema>;

const ARRAY_FIELDS = [
  'municipiosContemplados',
  'criteriosElegibilidade',
  'restricoes',
  'etapasInscricao',
  'documentosExigidos',
  'ambiguidadesDetectadas',
] as const;

const SCALAR_FIELDS = [
  'titulo',
  'orgaoResponsavel',
  'objeto',
  'resumo',
  'publicoAlvo',
  'valorMinimo',
  'valorMaximo',
  'dataInicioInscricao',
  'dataFimInscricao',
] as const;

/**
 * The provider's JSON schema only forces presence of array fields; scalar fields
 * and nested optional properties (e.g. paginaAproximada) may be omitted entirely
 * rather than sent as null. Normalize before Zod validation so a merely-absent
 * field isn't treated as a schema violation.
 */
export function normalizeExtraction(raw: unknown): unknown {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return raw;
  }

  const normalized: Record<string, unknown> = {
    ...(raw as Record<string, unknown>),
  };

  for (const field of ARRAY_FIELDS) {
    if (!Array.isArray(normalized[field])) {
      normalized[field] = [];
    }
  }
  for (const field of SCALAR_FIELDS) {
    if (normalized[field] === undefined) {
      normalized[field] = null;
    }
  }

  if (Array.isArray(normalized.documentosExigidos)) {
    normalized.documentosExigidos = normalized.documentosExigidos.map(
      (item) => {
        if (typeof item !== 'object' || item === null) return item;
        const doc = { ...(item as Record<string, unknown>) };
        if (doc.paginaAproximada === undefined) doc.paginaAproximada = null;
        return doc;
      },
    );
  }

  return normalized;
}
