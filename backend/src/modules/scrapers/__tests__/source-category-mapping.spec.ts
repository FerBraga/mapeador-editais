import { SourceType } from '@prisma/client';
import { SOURCE_TYPE_TO_CATEGORY_SLUG } from '../source-category-mapping';

describe('SOURCE_TYPE_TO_CATEGORY_SLUG', () => {
  it('maps every SourceType enum value to a category slug', () => {
    expect(SOURCE_TYPE_TO_CATEGORY_SLUG[SourceType.CULTURE]).toBe('cultura');
    expect(SOURCE_TYPE_TO_CATEGORY_SLUG[SourceType.INNOVATION]).toBe('inovacao-e-tecnologia');
    expect(SOURCE_TYPE_TO_CATEGORY_SLUG[SourceType.PUBLIC_PROCUREMENT]).toBe('licitacoes-e-compras');
    expect(SOURCE_TYPE_TO_CATEGORY_SLUG[SourceType.OTHER]).toBe('outros');
  });

  it('has no SourceType enum value left unmapped', () => {
    const mappedTypes = Object.keys(SOURCE_TYPE_TO_CATEGORY_SLUG);
    const allTypes = Object.values(SourceType);
    expect(mappedTypes.sort()).toEqual([...allTypes].sort());
  });
});
