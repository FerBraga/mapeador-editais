import { bootstrapWorker } from './bootstrap-worker';
import { DocumentWorkerModule } from './document-worker.module';

bootstrapWorker('DocumentWorker', DocumentWorkerModule);
