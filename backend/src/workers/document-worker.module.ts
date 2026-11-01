import { Module } from '@nestjs/common';
import { AppModule } from '../app.module';
import { DocumentProcessorModule } from '../modules/documents/document-processor.module';

@Module({
  imports: [AppModule, DocumentProcessorModule],
})
export class DocumentWorkerModule {}
