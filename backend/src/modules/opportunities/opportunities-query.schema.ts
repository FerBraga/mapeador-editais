import { z } from 'zod';
import { OpportunityStatus } from '@prisma/client';
import { PaginationQuerySchema } from '../../shared/validators/pagination.schema';

/**
 * z.coerce.boolean() treats any non-empty string (including "false") as true,
 * so query booleans need explicit string->boolean mapping instead.
 */
const booleanQueryParam = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => (value === undefined ? undefined : value === 'true'));

export const OpportunityListQuerySchema = PaginationQuerySchema.extend({
  municipalityId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  sourceId: z.string().uuid().optional(),
  status: z.nativeEnum(OpportunityStatus).optional(),
  onlyOpen: booleanQueryParam,
  fundingMin: z.coerce.number().nonnegative().optional(),
  fundingMax: z.coerce.number().nonnegative().optional(),
  q: z.string().trim().min(1).max(200).optional(),
});

export type OpportunityListQuery = z.infer<typeof OpportunityListQuerySchema>;
