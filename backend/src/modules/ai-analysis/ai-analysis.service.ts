import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AIAnalysisStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { Env } from '../../shared/config/env.schema';
import {
  AI_ANALYSIS_QUEUE,
  ANALYZE_DOCUMENT_JOB,
} from './ai-analysis.constants';
import {
  AI_PROVIDER,
  AiExtractionCallResult,
  AiProvider,
} from './ai-provider.interface';
import {
  normalizeExtraction,
  OpportunityExtraction,
  OpportunityExtractionSchema,
} from './extraction-schema';
import { PROMPT_VERSION } from './prompt';
import { truncateText } from './text-truncation';
import { GeolocationService } from '../geolocation/geolocation.service';

@Injectable()
export class AiAnalysisService {
  private readonly logger = new Logger(AiAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
    @InjectQueue(AI_ANALYSIS_QUEUE) private readonly queue: Queue,
    @Inject(AI_PROVIDER) private readonly provider: AiProvider,
    private readonly geolocation: GeolocationService,
  ) {}

  async enqueueAnalysis(documentId: string): Promise<{ jobId: string }> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) {
      throw new NotFoundException(`Document "${documentId}" not found`);
    }
    if (!document.extractedText) {
      throw new BadRequestException(
        `Document "${documentId}" has no extracted text available for analysis (needsOcr or non-PDF file)`,
      );
    }

    const job = await this.queue.add(ANALYZE_DOCUMENT_JOB, { documentId });
    return { jobId: job.id as string };
  }

  async analyzeDocument(documentId: string): Promise<void> {
    const document = await this.prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) {
      this.logger.warn(`Document "${documentId}" not found, skipping analysis`);
      return;
    }
    if (!document.extractedText) {
      this.logger.warn(
        `Document "${documentId}" has no extracted text, skipping analysis`,
      );
      return;
    }

    const maxChars = this.config.get('AI_MAX_INPUT_CHARS', { infer: true });
    const truncatedText = truncateText(document.extractedText, maxChars);

    let result: AiExtractionCallResult;
    try {
      result = await this.provider.extract(truncatedText);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(
        `AI provider call failed for document "${documentId}": ${message}`,
      );
      await this.persistFailedAnalysis(
        document.opportunityId,
        documentId,
        this.config.get('AI_MODEL', { infer: true }),
        message,
      );
      return;
    }

    const parsed = OpportunityExtractionSchema.safeParse(
      normalizeExtraction(result.raw),
    );
    if (!parsed.success) {
      const message = `Resposta do provedor não segue o schema esperado: ${parsed.error.message}`;
      this.logger.error(
        `AI analysis validation failed for document "${documentId}": ${message}`,
      );
      await this.persistFailedAnalysis(
        document.opportunityId,
        documentId,
        result.model,
        message,
      );
      return;
    }

    await this.persistSuccessfulAnalysis(
      document.opportunityId,
      documentId,
      result,
      parsed.data,
    );

    await this.geolocation.enqueueResolution(document.opportunityId);
  }

  private async persistFailedAnalysis(
    opportunityId: string,
    documentId: string,
    model: string,
    message: string,
  ): Promise<void> {
    await this.prisma.aIAnalysis.create({
      data: {
        opportunityId,
        documentId,
        model,
        promptVersion: PROMPT_VERSION,
        status: AIAnalysisStatus.FAILED,
        errorMessage: message,
      },
    });
  }

  private async persistSuccessfulAnalysis(
    opportunityId: string,
    documentId: string,
    result: AiExtractionCallResult,
    data: OpportunityExtraction,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.aIAnalysis.create({
        data: {
          opportunityId,
          documentId,
          model: result.model,
          promptVersion: PROMPT_VERSION,
          status: AIAnalysisStatus.COMPLETED,
          summary: data.resumo,
          structuredResult: data as unknown as Prisma.InputJsonValue,
          tokensInput: result.tokensInput,
          tokensOutput: result.tokensOutput,
        },
      });

      for (const requiredDoc of data.documentosExigidos) {
        await tx.requiredDocument.create({
          data: {
            opportunityId,
            name: requiredDoc.nome,
            documentCategory: requiredDoc.categoria,
            isMandatory: requiredDoc.obrigatorio,
            evidence: requiredDoc.evidencia,
            sourceDocumentId: documentId,
            sourcePage: requiredDoc.paginaAproximada,
          },
        });
      }

      await this.fillOpportunityGaps(tx, opportunityId, data);
    });
  }

  private async fillOpportunityGaps(
    tx: Prisma.TransactionClient,
    opportunityId: string,
    data: OpportunityExtraction,
  ): Promise<void> {
    const opportunity = await tx.opportunity.findUnique({
      where: { id: opportunityId },
    });
    if (!opportunity) return;

    const updateData: Prisma.OpportunityUpdateInput = {};

    if (opportunity.description === null && data.resumo) {
      updateData.description = data.resumo;
    }
    if (opportunity.object === null && data.objeto) {
      updateData.object = data.objeto;
    }
    if (opportunity.fundingMin === null && data.valorMinimo !== null) {
      updateData.fundingMin = data.valorMinimo;
    }
    if (opportunity.fundingMax === null && data.valorMaximo !== null) {
      updateData.fundingMax = data.valorMaximo;
    }
    if (opportunity.registrationStartAt === null && data.dataInicioInscricao) {
      const date = parseDateSafely(data.dataInicioInscricao);
      if (date) updateData.registrationStartAt = date;
    }
    if (opportunity.registrationEndAt === null && data.dataFimInscricao) {
      const date = parseDateSafely(data.dataFimInscricao);
      if (date) updateData.registrationEndAt = date;
    }

    if (Object.keys(updateData).length > 0) {
      await tx.opportunity.update({
        where: { id: opportunityId },
        data: updateData,
      });
    }
  }
}

function parseDateSafely(value: string): Date | null {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
