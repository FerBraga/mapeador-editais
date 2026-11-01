import { ConflictException, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Prisma, ScraperExecutionStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { DocumentsService } from '../documents/documents.service';
import { NOTICE_SCRAPERS, NoticeScraper } from './contracts/notice-scraper.interface';
import { ScraperNormalizationService } from './scraper-normalization.service';
import { SCRAPERS_QUEUE, RUN_SOURCE_JOB } from './scrapers.constants';

export type ScraperRunSummary = {
  executionId: string;
  status: ScraperExecutionStatus;
  itemsFound: number;
  itemsCreated: number;
  itemsUpdated: number;
};

@Injectable()
export class ScrapersService {
  private readonly logger = new Logger(ScrapersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly normalization: ScraperNormalizationService,
    private readonly documents: DocumentsService,
    @Inject(NOTICE_SCRAPERS) private readonly scrapers: NoticeScraper[],
    @InjectQueue(SCRAPERS_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueueManualRun(scraperKey: string): Promise<{ jobId: string }> {
    const scraper = this.scrapers.find((s) => s.sourceKey === scraperKey);
    if (!scraper) {
      throw new NotFoundException(`No scraper registered for key "${scraperKey}"`);
    }

    const source = await this.prisma.source.findUnique({ where: { scraperKey } });
    if (!source) {
      throw new NotFoundException(`No source registered for scraper key "${scraperKey}"`);
    }

    const job = await this.queue.add(RUN_SOURCE_JOB, { scraperKey });
    return { jobId: job.id as string };
  }

  async runSource(scraperKey: string): Promise<ScraperRunSummary> {
    const scraper = this.scrapers.find((s) => s.sourceKey === scraperKey);
    if (!scraper) {
      throw new NotFoundException(`No scraper registered for key "${scraperKey}"`);
    }

    const source = await this.prisma.source.findUnique({ where: { scraperKey } });
    if (!source) {
      throw new NotFoundException(`No source registered for scraper key "${scraperKey}"`);
    }

    const runningExecution = await this.prisma.scraperExecution.findFirst({
      where: { sourceId: source.id, status: ScraperExecutionStatus.RUNNING },
    });
    if (runningExecution) {
      throw new ConflictException(
        `A scraper execution is already running for source "${scraperKey}" (execution ${runningExecution.id})`,
      );
    }

    const execution = await this.prisma.scraperExecution.create({
      data: { sourceId: source.id, status: ScraperExecutionStatus.RUNNING, startedAt: new Date() },
    });

    let itemsFound = 0;
    let itemsCreated = 0;
    let itemsUpdated = 0;
    let itemsFailed = 0;
    const errors: string[] = [];

    try {
      const rawOpportunities = await scraper.fetchOpportunities();
      itemsFound = rawOpportunities.length;

      for (const rawOpportunity of rawOpportunities) {
        try {
          const details = await scraper.fetchOpportunityDetails(rawOpportunity.externalId);
          const normalized = this.normalization.normalize(details);
          const result = await this.upsertOpportunity(source.id, scraperKey, normalized);
          if (result === 'created') itemsCreated += 1;
          if (result === 'updated') itemsUpdated += 1;
        } catch (error) {
          itemsFailed += 1;
          const message = error instanceof Error ? error.message : String(error);
          errors.push(`${rawOpportunity.externalId}: ${message}`);
          this.logger.error(
            `Failed to process opportunity "${rawOpportunity.externalId}" from source "${scraperKey}": ${message}`,
          );
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await this.prisma.scraperExecution.update({
        where: { id: execution.id },
        data: {
          status: ScraperExecutionStatus.FAILED,
          finishedAt: new Date(),
          itemsFound,
          itemsCreated,
          itemsUpdated,
          errorMessage: message,
        },
      });
      throw error;
    }

    const status =
      itemsFailed === 0
        ? ScraperExecutionStatus.COMPLETED
        : itemsCreated + itemsUpdated > 0
          ? ScraperExecutionStatus.PARTIALLY_COMPLETED
          : ScraperExecutionStatus.FAILED;

    await this.prisma.$transaction([
      this.prisma.scraperExecution.update({
        where: { id: execution.id },
        data: {
          status,
          finishedAt: new Date(),
          itemsFound,
          itemsCreated,
          itemsUpdated,
          errorMessage: errors.length > 0 ? errors.join('; ') : null,
        },
      }),
      this.prisma.source.update({
        where: { id: source.id },
        data: { lastExecutionAt: new Date() },
      }),
    ]);

    return { executionId: execution.id, status, itemsFound, itemsCreated, itemsUpdated };
  }

  private async upsertOpportunity(
    sourceId: string,
    scraperKey: string,
    normalized: ReturnType<ScraperNormalizationService['normalize']>,
  ): Promise<'created' | 'updated' | 'unchanged'> {
    const existing = await this.prisma.opportunity.findUnique({
      where: { sourceId_externalId: { sourceId, externalId: normalized.externalId } },
    });

    if (!existing) {
      const opportunity = await this.prisma.opportunity.create({
        data: {
          sourceId,
          externalId: normalized.externalId,
          title: normalized.title,
          slug: this.buildSlug(scraperKey, normalized.externalId),
          issuingOrganization: normalized.issuingOrganization,
          description: normalized.description,
          officialUrl: normalized.officialUrl,
          rawData: normalized.rawData as Prisma.InputJsonValue,
          contentHash: normalized.contentHash,
          lastScrapedAt: new Date(),
        },
      });
      await this.createPendingDocuments(opportunity.id, normalized.attachments);
      return 'created';
    }

    if (existing.contentHash === normalized.contentHash) {
      await this.prisma.opportunity.update({
        where: { id: existing.id },
        data: { lastScrapedAt: new Date() },
      });
      return 'unchanged';
    }

    await this.prisma.opportunity.update({
      where: { id: existing.id },
      data: {
        title: normalized.title,
        issuingOrganization: normalized.issuingOrganization,
        description: normalized.description,
        officialUrl: normalized.officialUrl,
        rawData: normalized.rawData as Prisma.InputJsonValue,
        contentHash: normalized.contentHash,
        lastScrapedAt: new Date(),
      },
    });
    await this.createPendingDocuments(existing.id, normalized.attachments);
    return 'updated';
  }

  private async createPendingDocuments(
    opportunityId: string,
    attachments: { originalFilename: string; sourceUrl: string }[],
  ) {
    for (const attachment of attachments) {
      const existingDocument = await this.prisma.document.findFirst({
        where: { opportunityId, sourceUrl: attachment.sourceUrl },
      });
      if (existingDocument) continue;

      const document = await this.prisma.document.create({
        data: {
          opportunityId,
          originalFilename: attachment.originalFilename,
          sourceUrl: attachment.sourceUrl,
        },
      });
      await this.documents.enqueueNewDocument(document.id);
    }
  }

  private buildSlug(scraperKey: string, externalId: string): string {
    return `${scraperKey}-${externalId}`.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
  }
}
