import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';

@ApiTags('documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @Post(':id/reprocess')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Resets a document to PENDING and enqueues a new processing attempt',
    description: 'Returns immediately with the queued job id; processing runs asynchronously in the document worker.',
  })
  @ApiParam({ name: 'id', description: 'Document id' })
  reprocess(@Param('id') id: string) {
    return this.documentsService.reprocess(id);
  }
}
