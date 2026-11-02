import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { AiAnalysisService } from './ai-analysis.service';
import { AI_ANALYSIS_QUEUE } from './ai-analysis.constants';

@Processor(AI_ANALYSIS_QUEUE)
export class AiAnalysisQueueProcessor extends WorkerHost {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {
    super();
  }

  async process(job: Job) {
    const { documentId } = job.data as { documentId: string };
    return this.aiAnalysisService.analyzeDocument(documentId);
  }
}
