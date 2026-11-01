import { Module } from '@nestjs/common';
import { DocumentsModule } from './documents.module';
import { DocumentQueueProcessor } from './document.processor';

@Module({
  imports: [DocumentsModule],
  providers: [DocumentQueueProcessor],
})
export class DocumentProcessorModule {}
