import { Module } from '@nestjs/common';
import { AppModule } from '../app.module';
import { AiAnalysisProcessorModule } from '../modules/ai-analysis/ai-analysis-processor.module';

@Module({
  imports: [AppModule, AiAnalysisProcessorModule],
})
export class AiAnalysisWorkerModule {}
