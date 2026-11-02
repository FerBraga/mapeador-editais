import { Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { AiAnalysisService } from './ai-analysis.service';

@ApiTags('ai-analysis')
@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}

  @Post('documents/:documentId')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({
    summary: 'Dispara manualmente a análise de IA de um documento',
    description:
      'Enfileira a extração estruturada do texto do documento; o processamento ocorre de forma assíncrona em um worker dedicado. Requer que o documento já tenha extractedText disponível.',
  })
  @ApiParam({ name: 'documentId', description: 'Document id' })
  analyze(@Param('documentId') documentId: string) {
    return this.aiAnalysisService.enqueueAnalysis(documentId);
  }
}
