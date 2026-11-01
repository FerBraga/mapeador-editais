import { bootstrapWorker } from './bootstrap-worker';
import { ScraperWorkerModule } from './scraper-worker.module';

bootstrapWorker('ScraperWorker', ScraperWorkerModule);
