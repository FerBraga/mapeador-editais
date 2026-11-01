import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { ScrapersService } from './scrapers.service';

@ApiTags('scrapers')
@Controller('scrapers')
export class ScrapersController {
  constructor(private readonly scrapersService: ScrapersService) {}

  @Post(':scraperKey/run')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Enqueues a manual execution of the scraper for the given source',
    description:
      'Returns immediately with the queued job id; the scraping itself runs asynchronously in the scraper worker process.',
  })
  @ApiParam({ name: 'scraperKey', example: 'cultura-pr' })
  run(@Param('scraperKey') scraperKey: string) {
    return this.scrapersService.enqueueManualRun(scraperKey);
  }
}
