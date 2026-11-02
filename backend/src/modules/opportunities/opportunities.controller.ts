import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../shared/validators/zod-validation.pipe';
import { OpportunitiesService } from './opportunities.service';
import {
  OpportunityListQuery,
  OpportunityListQuerySchema,
} from './opportunities-query.schema';

@ApiTags('opportunities')
@Controller('opportunities')
export class OpportunitiesController {
  constructor(private readonly opportunitiesService: OpportunitiesService) {}

  @Get()
  @ApiOperation({
    summary: 'Lista oportunidades com filtros e paginação',
    description:
      'Filtros: municipalityId (inclui editais estaduais), categoryId, sourceId, status, onlyOpen (best-effort a partir das datas), fundingMin/fundingMax, q (busca livre).',
  })
  findMany(
    @Query(new ZodValidationPipe(OpportunityListQuerySchema))
    query: OpportunityListQuery,
  ) {
    return this.opportunitiesService.findMany(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detalhe completo de uma oportunidade' })
  @ApiParam({ name: 'id', description: 'Opportunity id' })
  findOne(@Param('id') id: string) {
    return this.opportunitiesService.findOne(id);
  }
}
