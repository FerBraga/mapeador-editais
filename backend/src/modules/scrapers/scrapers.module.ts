import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ScrapersController } from './scrapers.controller';
import { ScrapersService } from './scrapers.service';
import { ScraperNormalizationService } from './scraper-normalization.service';
import { ScraperSchedulerService } from './scraper-scheduler.service';
import { NOTICE_SCRAPERS } from './contracts/notice-scraper.interface';
import { CulturaPrScraper } from './cultura-pr/cultura-pr.scraper';
import { SCRAPERS_QUEUE } from './scrapers.constants';

@Module({
  imports: [BullModule.registerQueue({ name: SCRAPERS_QUEUE })],
  controllers: [ScrapersController],
  providers: [
    ScrapersService,
    ScraperNormalizationService,
    ScraperSchedulerService,
    CulturaPrScraper,
    {
      provide: NOTICE_SCRAPERS,
      useFactory: (culturaPr: CulturaPrScraper) => [culturaPr],
      inject: [CulturaPrScraper],
    },
  ],
  exports: [ScrapersService, BullModule],
})
export class ScrapersModule {}
