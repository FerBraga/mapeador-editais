import { SourceType } from '@prisma/client';

/**
 * Derives an Opportunity's category from its Source's sourceType - the 3
 * active scrapers are each thematically homogeneous enough for this to be
 * accurate without per-opportunity classification. See
 * openspec/changes/categorizacao-por-fonte/design.md.
 */
export const SOURCE_TYPE_TO_CATEGORY_SLUG: Record<SourceType, string> = {
  [SourceType.CULTURE]: 'cultura',
  [SourceType.INNOVATION]: 'inovacao-e-tecnologia',
  [SourceType.PUBLIC_PROCUREMENT]: 'licitacoes-e-compras',
  [SourceType.OTHER]: 'outros',
};
