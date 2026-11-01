import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ScrapersService } from './scrapers.service';
import { SCRAPERS_QUEUE } from './scrapers.constants';

@Processor(SCRAPERS_QUEUE)
export class ScraperQueueProcessor extends WorkerHost {
  constructor(private readonly scrapersService: ScrapersService) {
    super();
  }

  async process(job: Job) {
    const { scraperKey } = job.data as { scraperKey: string };
    return this.scrapersService.runSource(scraperKey);
  }
}
