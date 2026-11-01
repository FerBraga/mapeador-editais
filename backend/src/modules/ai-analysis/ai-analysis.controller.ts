import { Controller } from '@nestjs/common';
import { AiAnalysisService } from './ai-analysis.service';

@Controller('ai-analysis')
export class AiAnalysisController {
  constructor(private readonly aiAnalysisService: AiAnalysisService) {}
}
