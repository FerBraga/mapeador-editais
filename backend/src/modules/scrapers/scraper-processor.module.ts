import { Module } from '@nestjs/common';
import { ScrapersModule } from './scrapers.module';
import { ScraperQueueProcessor } from './scraper.processor';

@Module({
  imports: [ScrapersModule],
  providers: [ScraperQueueProcessor],
})
export class ScraperProcessorModule {}
