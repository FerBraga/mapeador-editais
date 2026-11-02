import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MunicipalitiesService } from './municipalities.service';

@ApiTags('municipalities')
@Controller('municipalities')
export class MunicipalitiesController {
  constructor(private readonly municipalitiesService: MunicipalitiesService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lista municípios do Paraná com coordenadas e contagem de oportunidades vinculadas',
    description:
      'Plumbing mínima para o mapa: base de pinos e indicador de volume por município.',
  })
  findAll() {
    return this.municipalitiesService.findAll();
  }
}
