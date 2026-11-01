import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('health')
@Controller('health')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ summary: 'Checks API and database connectivity' })
  async getHealth() {
    const health = await this.appService.getHealth();
    if (health.status === 'error') {
      throw new ServiceUnavailableException(health);
    }
    return health;
  }
}
