import { bootstrapWorker } from './bootstrap-worker';
import { AiAnalysisWorkerModule } from './ai-analysis-worker.module';

bootstrapWorker('AiAnalysisWorker', AiAnalysisWorkerModule);
