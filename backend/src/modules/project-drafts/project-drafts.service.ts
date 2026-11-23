import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AIAnalysis, AIAnalysisStatus, ProjectDraft, ProjectDraftSectionKey } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { Env } from '../../shared/config/env.schema';
import { AI_PROVIDER, AiProvider } from '../ai-analysis/ai-provider.interface';
import { OpportunityExtraction } from '../ai-analysis/extraction-schema';
import { SECTION_DEFINITIONS, getSectionDefinition } from './project-drafts.constants';
import {
  QA_SYSTEM_PROMPT,
  SECTION_SYSTEM_PROMPT,
  buildOpportunityContextSummary,
  buildQuestionUserContent,
  buildSectionUserContent,
} from './prompts';

interface DraftContext {
  draft: ProjectDraft;
  contextSummary: string;
}

@Injectable()
export class ProjectDraftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    @Inject(AI_PROVIDER) private readonly aiProvider: AiProvider,
  ) {}

  async getDraftState(userId: string, opportunityId: string) {
    const { draft } = await this.getOrCreateDraft(userId, opportunityId);

    const [sections, questions] = await Promise.all([
      this.prisma.projectDraftSectionEntry.findMany({ where: { draftId: draft.id } }),
      this.prisma.projectDraftQuestion.findMany({
        where: { draftId: draft.id },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    const maxRegenerations = this.config.get('WIZARD_MAX_SECTION_REGENERATIONS', { infer: true });
    const maxQuestions = this.config.get('WIZARD_MAX_QUESTIONS_PER_OPPORTUNITY', { infer: true });

    return {
      draftId: draft.id,
      sections: SECTION_DEFINITIONS.map((definition) => {
        const existing = sections.find((s) => s.section === definition.section);
        return {
          section: definition.section,
          title: definition.title,
          questions: definition.questions,
          answers: (existing?.answers as Record<string, string> | null) ?? null,
          generatedText: existing?.generatedText ?? null,
          regenerationsUsed: existing?.regenerationCount ?? 0,
          maxRegenerations,
        };
      }),
      questions: questions.map((q) => ({
        id: q.id,
        question: q.question,
        answer: q.answer,
        createdAt: q.createdAt,
      })),
      questionsUsed: questions.length,
      maxQuestions,
    };
  }

  async submitSection(
    userId: string,
    opportunityId: string,
    section: ProjectDraftSectionKey,
    answers: Record<string, string>,
  ) {
    const { draft, contextSummary } = await this.getOrCreateDraft(userId, opportunityId);
    const existing = await this.prisma.projectDraftSectionEntry.findUnique({
      where: { draftId_section: { draftId: draft.id, section } },
    });

    const maxRegenerations = this.config.get('WIZARD_MAX_SECTION_REGENERATIONS', { infer: true });
    if (existing && existing.regenerationCount >= maxRegenerations) {
      throw new BadRequestException('Limite de regenerações desta seção foi atingido');
    }

    const generatedText = await this.generateSectionText(section, answers, contextSummary);

    return this.prisma.projectDraftSectionEntry.upsert({
      where: { draftId_section: { draftId: draft.id, section } },
      create: { draftId: draft.id, section, answers, generatedText },
      update: {
        answers,
        generatedText,
        regenerationCount: existing ? existing.regenerationCount + 1 : 0,
      },
    });
  }

  async regenerateSection(userId: string, opportunityId: string, section: ProjectDraftSectionKey) {
    const { draft, contextSummary } = await this.getOrCreateDraft(userId, opportunityId);
    const existing = await this.prisma.projectDraftSectionEntry.findUnique({
      where: { draftId_section: { draftId: draft.id, section } },
    });
    if (!existing || !existing.answers) {
      throw new BadRequestException('Responda as perguntas da seção antes de pedir uma nova geração');
    }

    const maxRegenerations = this.config.get('WIZARD_MAX_SECTION_REGENERATIONS', { infer: true });
    if (existing.regenerationCount >= maxRegenerations) {
      throw new BadRequestException('Limite de regenerações desta seção foi atingido');
    }

    const generatedText = await this.generateSectionText(
      section,
      existing.answers as Record<string, string>,
      contextSummary,
    );

    return this.prisma.projectDraftSectionEntry.update({
      where: { id: existing.id },
      data: { generatedText, regenerationCount: existing.regenerationCount + 1 },
    });
  }

  async askQuestion(userId: string, opportunityId: string, question: string) {
    const { draft, contextSummary } = await this.getOrCreateDraft(userId, opportunityId);

    const maxQuestions = this.config.get('WIZARD_MAX_QUESTIONS_PER_OPPORTUNITY', { infer: true });
    const askedCount = await this.prisma.projectDraftQuestion.count({ where: { draftId: draft.id } });
    if (askedCount >= maxQuestions) {
      throw new BadRequestException('Limite de perguntas sobre este edital foi atingido');
    }

    const result = await this.aiProvider.generateText(
      QA_SYSTEM_PROMPT,
      buildQuestionUserContent(question, contextSummary),
    );

    return this.prisma.projectDraftQuestion.create({
      data: { draftId: draft.id, question, answer: result.text },
    });
  }

  private async generateSectionText(
    section: ProjectDraftSectionKey,
    answers: Record<string, string>,
    contextSummary: string,
  ): Promise<string> {
    const definition = getSectionDefinition(section);
    const userContent = buildSectionUserContent(definition, answers, contextSummary);
    const result = await this.aiProvider.generateText(SECTION_SYSTEM_PROMPT, userContent);
    return result.text;
  }

  /**
   * A draft only exists for editais whose AI extraction is already
   * COMPLETED - the wizard never runs extraction on demand, it only reuses
   * what `ai-analysis` already produced.
   */
  private async getOrCreateDraft(userId: string, opportunityId: string): Promise<DraftContext> {
    const latestAnalysis: AIAnalysis | null = await this.prisma.aIAnalysis.findFirst({
      where: { opportunityId, status: AIAnalysisStatus.COMPLETED },
      orderBy: { createdAt: 'desc' },
    });
    if (!latestAnalysis) {
      throw new BadRequestException('Este edital ainda não está pronto para o wizard de escrita');
    }

    const draft = await this.prisma.projectDraft.upsert({
      where: { userId_opportunityId: { userId, opportunityId } },
      create: { userId, opportunityId },
      update: {},
    });

    const contextSummary = buildOpportunityContextSummary(
      latestAnalysis.structuredResult as OpportunityExtraction | null,
    );

    return { draft, contextSummary };
  }
}
