import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { GeolocationService } from './geolocation.service';

@ApiTags('geolocation')
@Controller('geolocation')
export class GeolocationController {
  constructor(private readonly geolocationService: GeolocationService) {}

  @Post('opportunities/:opportunityId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Dispara manualmente a resolução geográfica de uma oportunidade',
    description:
      'Enfileira o recálculo dos municípios contemplados a partir das análises de IA já existentes; processamento ocorre de forma assíncrona em um worker dedicado.',
  })
  @ApiParam({ name: 'opportunityId', description: 'Opportunity id' })
  resolve(@Param('opportunityId') opportunityId: string) {
    return this.geolocationService.enqueueResolution(opportunityId);
  }
}
