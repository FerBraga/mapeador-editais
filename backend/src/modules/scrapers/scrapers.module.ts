import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsModule } from '../documents/documents.module';
import { ScrapersController } from './scrapers.controller';
import { ScrapersService } from './scrapers.service';
import { ScraperNormalizationService } from './scraper-normalization.service';
import { ScraperSchedulerService } from './scraper-scheduler.service';
import { NOTICE_SCRAPERS } from './contracts/notice-scraper.interface';
import { CulturaPrScraper } from './cultura-pr/cultura-pr.scraper';
import { FundacaoAraucariaScraper } from './fundacao-araucaria/fundacao-araucaria.scraper';
import { PncpPrScraper } from './pncp-pr/pncp-pr.scraper';
import { SCRAPERS_QUEUE } from './scrapers.constants';

@Module({
  imports: [BullModule.registerQueue({ name: SCRAPERS_QUEUE }), DocumentsModule],
  controllers: [ScrapersController],
  providers: [
    ScrapersService,
    ScraperNormalizationService,
    ScraperSchedulerService,
    CulturaPrScraper,
    FundacaoAraucariaScraper,
    PncpPrScraper,
    {
      provide: NOTICE_SCRAPERS,
      useFactory: (
        culturaPr: CulturaPrScraper,
        fundacaoAraucaria: FundacaoAraucariaScraper,
        pncpPr: PncpPrScraper,
      ) => [culturaPr, fundacaoAraucaria, pncpPr],
      inject: [CulturaPrScraper, FundacaoAraucariaScraper, PncpPrScraper],
    },
  ],
  exports: [ScrapersService, BullModule],
})
export class ScrapersModule {}
