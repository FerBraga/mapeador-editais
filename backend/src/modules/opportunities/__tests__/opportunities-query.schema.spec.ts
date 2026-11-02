import { OpportunityListQuerySchema } from '../opportunities-query.schema';

describe('OpportunityListQuerySchema', () => {
  it('applies pagination defaults when none are given', () => {
    const result = OpportunityListQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 20 });
  });

  it('rejects a pageSize above the maximum', () => {
    expect(
      OpportunityListQuerySchema.safeParse({ pageSize: '101' }).success,
    ).toBe(false);
  });

  it('rejects an invalid status value', () => {
    expect(
      OpportunityListQuerySchema.safeParse({ status: 'NOT_A_STATUS' }).success,
    ).toBe(false);
  });

  it('accepts a valid status value', () => {
    const result = OpportunityListQuerySchema.parse({ status: 'OPEN' });
    expect(result.status).toBe('OPEN');
  });

  it('coerces onlyOpen from the string "true" to a boolean, not via truthiness', () => {
    expect(
      OpportunityListQuerySchema.parse({ onlyOpen: 'true' }).onlyOpen,
    ).toBe(true);
    expect(
      OpportunityListQuerySchema.parse({ onlyOpen: 'false' }).onlyOpen,
    ).toBe(false);
  });

  it('rejects an invalid onlyOpen value instead of silently coercing it', () => {
    expect(
      OpportunityListQuerySchema.safeParse({ onlyOpen: 'yes' }).success,
    ).toBe(false);
  });

  it('rejects a non-uuid municipalityId', () => {
    expect(
      OpportunityListQuerySchema.safeParse({ municipalityId: 'not-a-uuid' })
        .success,
    ).toBe(false);
  });
});
