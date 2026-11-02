import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AIAnalysisStatus } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import {
  GEOLOCATION_QUEUE,
  RESOLVE_OPPORTUNITY_JOB,
} from './geolocation.constants';
import { MunicipalityMatcherService } from './municipality-matcher.service';
import { isStatewideMention } from './statewide-detector';

@Injectable()
export class GeolocationService {
  private readonly logger = new Logger(GeolocationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly matcher: MunicipalityMatcherService,
    @InjectQueue(GEOLOCATION_QUEUE) private readonly queue: Queue,
  ) {}

  async enqueueResolution(opportunityId: string): Promise<{ jobId: string }> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });
    if (!opportunity) {
      throw new NotFoundException(`Opportunity "${opportunityId}" not found`);
    }

    const job = await this.queue.add(RESOLVE_OPPORTUNITY_JOB, {
      opportunityId,
    });
    return { jobId: job.id as string };
  }

  /**
   * Recomputes municipality links for an opportunity from scratch, unioning
   * municipiosContemplados across every COMPLETED AIAnalysis (not just the one
   * that triggered this run) and fully replacing the previous link set - this
   * is a derived index for map filtering, not an audit trail, so it is safe
   * (and correct) to recalculate rather than accumulate.
   */
  async resolveOpportunity(opportunityId: string): Promise<void> {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id: opportunityId },
    });
    if (!opportunity) {
      this.logger.warn(
        `Opportunity "${opportunityId}" not found, skipping geolocation resolution`,
      );
      return;
    }

    const analyses = await this.prisma.aIAnalysis.findMany({
      where: { opportunityId, status: AIAnalysisStatus.COMPLETED },
      select: { structuredResult: true },
    });

    const mentions = dedupeMentions(
      analyses.flatMap((analysis) =>
        extractMunicipalityMentions(analysis.structuredResult),
      ),
    );

    let coversEntireState = false;
    const matchedMunicipalityIds = new Set<string>();
    const unresolved: string[] = [];

    for (const mention of mentions) {
      if (isStatewideMention(mention)) {
        coversEntireState = true;
        continue;
      }

      const match = await this.matcher.match(mention);
      if (match) {
        matchedMunicipalityIds.add(match.municipalityId);
      } else {
        unresolved.push(mention);
      }
    }

    if (unresolved.length > 0) {
      this.logger.warn(
        `Opportunity "${opportunityId}": could not resolve municipality mention(s): ${unresolved.join(', ')}`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.opportunityMunicipality.deleteMany({ where: { opportunityId } });
      if (matchedMunicipalityIds.size > 0) {
        await tx.opportunityMunicipality.createMany({
          data: Array.from(matchedMunicipalityIds).map((municipalityId) => ({
            opportunityId,
            municipalityId,
          })),
        });
      }
      await tx.opportunity.update({
        where: { id: opportunityId },
        data: { coversEntireState },
      });
    });
  }
}

function dedupeMentions(mentions: string[]): string[] {
  return Array.from(
    new Set(mentions.map((mention) => mention.trim()).filter(Boolean)),
  );
}

function extractMunicipalityMentions(structuredResult: unknown): string[] {
  if (typeof structuredResult !== 'object' || structuredResult === null)
    return [];
  const value = (structuredResult as Record<string, unknown>)
    .municipiosContemplados;
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}
