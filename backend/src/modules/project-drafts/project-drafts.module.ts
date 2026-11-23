import { Module } from '@nestjs/common';
import { AiAnalysisModule } from '../ai-analysis/ai-analysis.module';
import { ProjectDraftsController } from './project-drafts.controller';
import { ProjectDraftsService } from './project-drafts.service';

@Module({
  imports: [AiAnalysisModule],
  controllers: [ProjectDraftsController],
  providers: [ProjectDraftsService],
})
export class ProjectDraftsModule {}
