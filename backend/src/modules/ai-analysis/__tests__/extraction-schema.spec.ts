import {
  normalizeExtraction,
  OpportunityExtractionSchema,
} from '../extraction-schema';

describe('normalizeExtraction', () => {
  it('defaults missing array fields to empty arrays and missing scalars to null', () => {
    const raw = { titulo: 'Edital X' };
    const normalized = normalizeExtraction(raw) as Record<string, unknown>;

    expect(normalized.municipiosContemplados).toEqual([]);
    expect(normalized.documentosExigidos).toEqual([]);
    expect(normalized.orgaoResponsavel).toBeNull();
    expect(normalized.titulo).toBe('Edital X');
  });

  it('defaults a missing paginaAproximada on a required document item to null', () => {
    const raw = {
      documentosExigidos: [
        {
          nome: 'Certidão',
          categoria: 'TAX',
          obrigatorio: true,
          evidencia: 'trecho',
        },
      ],
    };
    const normalized = normalizeExtraction(raw) as {
      documentosExigidos: Array<{ paginaAproximada: unknown }>;
    };

    expect(normalized.documentosExigidos[0].paginaAproximada).toBeNull();
  });

  it('produces output that validates against OpportunityExtractionSchema', () => {
    const raw = {
      documentosExigidos: [
        {
          nome: 'Certidão',
          categoria: 'TAX',
          obrigatorio: true,
          evidencia: 'trecho',
        },
      ],
    };
    const result = OpportunityExtractionSchema.safeParse(
      normalizeExtraction(raw),
    );

    expect(result.success).toBe(true);
  });
});
