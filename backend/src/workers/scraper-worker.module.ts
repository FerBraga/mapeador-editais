import { Module } from '@nestjs/common';
import { AppModule } from '../app.module';
import { ScraperProcessorModule } from '../modules/scrapers/scraper-processor.module';

@Module({
  imports: [AppModule, ScraperProcessorModule],
})
export class ScraperWorkerModule {}
