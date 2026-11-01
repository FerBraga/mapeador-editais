import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { DAILY_SCRAPER_KEYS, DAILY_SCRAPE_CRON, RUN_SOURCE_JOB, SCRAPERS_QUEUE } from './scrapers.constants';

@Injectable()
export class ScraperSchedulerService implements OnModuleInit {
  constructor(@InjectQueue(SCRAPERS_QUEUE) private readonly queue: Queue) {}

  async onModuleInit() {
    for (const scraperKey of DAILY_SCRAPER_KEYS) {
      await this.queue.upsertJobScheduler(
        `daily-${scraperKey}`,
        { pattern: DAILY_SCRAPE_CRON },
        { name: RUN_SOURCE_JOB, data: { scraperKey } },
      );
    }
  }
}
