import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { DocumentsService } from './documents.service';
import { DOCUMENTS_QUEUE } from './documents.constants';

@Processor(DOCUMENTS_QUEUE)
export class DocumentQueueProcessor extends WorkerHost {
  constructor(private readonly documentsService: DocumentsService) {
    super();
  }

  async process(job: Job) {
    const { documentId } = job.data as { documentId: string };
    return this.documentsService.processDocument(documentId);
  }
}
