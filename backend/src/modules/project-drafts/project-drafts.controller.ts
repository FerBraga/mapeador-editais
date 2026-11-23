import { BadRequestException, Body, Controller, Get, Param, Post, Put, Req, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Request } from 'express';
import { ProjectDraftSectionKey } from '@prisma/client';
import { ZodValidationPipe } from '../../shared/validators/zod-validation.pipe';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AuthenticatedUser } from '../auth/jwt-payload.interface';
import { ProjectDraftsService } from './project-drafts.service';
import { AskQuestionInput, AskQuestionSchema, SectionParamSchema, buildAnswersSchema } from './project-drafts.schemas';

@ApiTags('project-drafts')
@Controller('project-drafts')
@UseGuards(JwtAuthGuard)
export class ProjectDraftsController {
  constructor(private readonly projectDraftsService: ProjectDraftsService) {}

  @Get(':opportunityId')
  @ApiOperation({ summary: 'Estado atual do rascunho de projeto do usuário autenticado para um edital' })
  @ApiParam({ name: 'opportunityId' })
  getDraft(@Req() request: Request, @Param('opportunityId') opportunityId: string) {
    const user = request.user as AuthenticatedUser;
    return this.projectDraftsService.getDraftState(user.id, opportunityId);
  }

  @Put(':opportunityId/sections/:section')
  @ApiOperation({ summary: 'Submete as respostas de uma seção e gera o texto correspondente' })
  @ApiParam({ name: 'opportunityId' })
  @ApiParam({ name: 'section', enum: ['JUSTIFICATIVA', 'OBJETIVOS', 'CONTRAPARTIDAS', 'ORCAMENTO'] })
  submitSection(
    @Req() request: Request,
    @Param('opportunityId') opportunityId: string,
    @Param(new ZodValidationPipe(SectionParamSchema)) params: { section: ProjectDraftSectionKey },
    @Body() body: unknown,
  ) {
    const user = request.user as AuthenticatedUser;
    const answersSchema = buildAnswersSchema(params.section);
    const parsed = answersSchema.safeParse(body);
    if (!parsed.success) {
      throw new BadRequestException(parsed.error.issues);
    }
    return this.projectDraftsService.submitSection(
      user.id,
      opportunityId,
      params.section,
      parsed.data.answers,
    );
  }

  @Post(':opportunityId/sections/:section/regenerate')
  @ApiOperation({ summary: 'Gera novamente o texto de uma seção já respondida, respeitando o limite' })
  @ApiParam({ name: 'opportunityId' })
  @ApiParam({ name: 'section', enum: ['JUSTIFICATIVA', 'OBJETIVOS', 'CONTRAPARTIDAS', 'ORCAMENTO'] })
  regenerateSection(
    @Req() request: Request,
    @Param('opportunityId') opportunityId: string,
    @Param(new ZodValidationPipe(SectionParamSchema)) params: { section: ProjectDraftSectionKey },
  ) {
    const user = request.user as AuthenticatedUser;
    return this.projectDraftsService.regenerateSection(user.id, opportunityId, params.section);
  }

  @Post(':opportunityId/questions')
  @ApiOperation({ summary: 'Faz uma pergunta pontual sobre o edital (limitada por usuário/edital)' })
  @ApiParam({ name: 'opportunityId' })
  askQuestion(
    @Req() request: Request,
    @Param('opportunityId') opportunityId: string,
    @Body(new ZodValidationPipe(AskQuestionSchema)) body: AskQuestionInput,
  ) {
    const user = request.user as AuthenticatedUser;
    return this.projectDraftsService.askQuestion(user.id, opportunityId, body.question);
  }
}
