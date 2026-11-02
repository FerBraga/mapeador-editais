import { Module } from '@nestjs/common';
import { AiAnalysisModule } from './ai-analysis.module';
import { AiAnalysisQueueProcessor } from './ai-analysis.processor';

@Module({
  imports: [AiAnalysisModule],
  providers: [AiAnalysisQueueProcessor],
})
export class AiAnalysisProcessorModule {}
