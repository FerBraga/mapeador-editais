import { Injectable, NotFoundException } from '@nestjs/common';
import { AIAnalysisStatus, OpportunityStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../shared/database/prisma.service';
import { buildPaginationMeta } from '../../shared/validators/pagination.schema';
import { OpportunityListQuery } from './opportunities-query.schema';
import {
  toOpportunityDetail,
  toOpportunitySummary,
} from './opportunities.mapper';

const NON_OPEN_STATUSES: OpportunityStatus[] = [
  OpportunityStatus.CLOSED,
  OpportunityStatus.CANCELLED,
  OpportunityStatus.SUSPENDED,
];

const SUMMARY_INCLUDE = {
  category: true,
  source: true,
  municipalityLinks: { include: { municipality: true } },
} as const;

@Injectable()
export class OpportunitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findMany(query: OpportunityListQuery) {
    const where = buildWhere(query);
    const { page, pageSize } = query;

    const [rows, total] = await this.prisma.$transaction([
      this.prisma.opportunity.findMany({
        where,
        orderBy: { registrationEndAt: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: SUMMARY_INCLUDE,
      }),
      this.prisma.opportunity.count({ where }),
    ]);

    return {
      data: rows.map(toOpportunitySummary),
      meta: buildPaginationMeta(page, pageSize, total),
    };
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: {
        ...SUMMARY_INCLUDE,
        requiredDocuments: true,
        aiAnalyses: {
          where: { status: AIAnalysisStatus.COMPLETED },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!opportunity) {
      throw new NotFoundException(`Opportunity "${id}" not found`);
    }

    return toOpportunityDetail(opportunity);
  }
}

function buildWhere(query: OpportunityListQuery): Prisma.OpportunityWhereInput {
  const and: Prisma.OpportunityWhereInput[] = [];

  if (query.municipalityId) {
    and.push({
      OR: [
        { coversEntireState: true },
        {
          municipalityLinks: { some: { municipalityId: query.municipalityId } },
        },
      ],
    });
  }
  if (query.categoryId) {
    and.push({ categoryId: query.categoryId });
  }
  if (query.sourceId) {
    and.push({ sourceId: query.sourceId });
  }
  if (query.status) {
    and.push({ status: query.status });
  }
  if (query.onlyOpen) {
    and.push({
      AND: [
        {
          OR: [
            { registrationEndAt: null },
            { registrationEndAt: { gte: new Date() } },
          ],
        },
        { status: { notIn: NON_OPEN_STATUSES } },
      ],
    });
  }
  if (query.fundingMin !== undefined) {
    and.push({ fundingMax: { gte: query.fundingMin } });
  }
  if (query.fundingMax !== undefined) {
    and.push({ fundingMin: { lte: query.fundingMax } });
  }
  if (query.q) {
    and.push({
      OR: [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { object: { contains: query.q, mode: 'insensitive' } },
      ],
    });
  }

  return and.length > 0 ? { AND: and } : {};
}
