import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { DocumentsController } from './documents.controller';
import { DocumentsService } from './documents.service';
import { DOCUMENTS_QUEUE } from './documents.constants';

@Module({
  imports: [BullModule.registerQueue({ name: DOCUMENTS_QUEUE })],
  controllers: [DocumentsController],
  providers: [DocumentsService],
  exports: [DocumentsService, BullModule],
})
export class DocumentsModule {}
