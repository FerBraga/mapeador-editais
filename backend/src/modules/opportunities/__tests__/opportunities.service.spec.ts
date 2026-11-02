import { NotFoundException } from '@nestjs/common';
import { OpportunitiesService } from '../opportunities.service';

function buildPrismaMock() {
  return {
    opportunity: {
      findMany: jest.fn().mockResolvedValue([]),
      count: jest.fn().mockResolvedValue(0),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((ops: Promise<unknown>[]) => Promise.all(ops)),
  };
}

const BASE_QUERY = { page: 1, pageSize: 20 } as const;

describe('OpportunitiesService.findMany', () => {
  it('combines municipality filter with statewide coverage via OR', async () => {
    const prisma = buildPrismaMock();
    const service = new OpportunitiesService(prisma as any);

    await service.findMany({ ...BASE_QUERY, municipalityId: 'mun-1' });

    const where = prisma.opportunity.findMany.mock.calls[0][0].where;
    expect(where).toEqual({
      AND: [
        {
          OR: [
            { coversEntireState: true },
            { municipalityLinks: { some: { municipalityId: 'mun-1' } } },
          ],
        },
      ],
    });
  });

  it('builds the onlyOpen filter from dates, excluding terminal statuses', async () => {
    const prisma = buildPrismaMock();
    const service = new OpportunitiesService(prisma as any);

    await service.findMany({ ...BASE_QUERY, onlyOpen: true });

    const where = prisma.opportunity.findMany.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({
      AND: [
        {
          OR: [
            { registrationEndAt: null },
            { registrationEndAt: { gte: expect.any(Date) } },
          ],
        },
        { status: { notIn: ['CLOSED', 'CANCELLED', 'SUSPENDED'] } },
      ],
    });
  });

  it('excludes opportunities with unknown funding when a funding filter is applied', async () => {
    const prisma = buildPrismaMock();
    const service = new OpportunitiesService(prisma as any);

    await service.findMany({
      ...BASE_QUERY,
      fundingMin: 1000,
      fundingMax: 5000,
    });

    const where = prisma.opportunity.findMany.mock.calls[0][0].where;
    expect(where.AND).toEqual(
      expect.arrayContaining([
        { fundingMax: { gte: 1000 } },
        { fundingMin: { lte: 5000 } },
      ]),
    );
  });

  it('searches title, description and object case-insensitively', async () => {
    const prisma = buildPrismaMock();
    const service = new OpportunitiesService(prisma as any);

    await service.findMany({ ...BASE_QUERY, q: 'cultura' });

    const where = prisma.opportunity.findMany.mock.calls[0][0].where;
    expect(where.AND[0]).toEqual({
      OR: [
        { title: { contains: 'cultura', mode: 'insensitive' } },
        { description: { contains: 'cultura', mode: 'insensitive' } },
        { object: { contains: 'cultura', mode: 'insensitive' } },
      ],
    });
  });

  it('returns an empty AND clause and pagination metadata when no filters are applied', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.count.mockResolvedValue(45);
    const service = new OpportunitiesService(prisma as any);

    const result = await service.findMany({ page: 2, pageSize: 20 });

    expect(prisma.opportunity.findMany.mock.calls[0][0].where).toEqual({});
    expect(prisma.opportunity.findMany.mock.calls[0][0].skip).toBe(20);
    expect(prisma.opportunity.findMany.mock.calls[0][0].take).toBe(20);
    expect(result.meta).toEqual({
      page: 2,
      pageSize: 20,
      total: 45,
      totalPages: 3,
    });
  });
});

describe('OpportunitiesService.findOne', () => {
  const BASE_OPPORTUNITY = {
    id: 'opp-1',
    title: 'Edital Teste',
    slug: 'edital-teste',
    issuingOrganization: null,
    officialUrl: 'https://example.test',
    status: 'UNKNOWN',
    fundingMin: null,
    fundingMax: null,
    registrationStartAt: null,
    registrationEndAt: null,
    publishedAt: null,
    coversEntireState: false,
    description: null,
    object: null,
    noticeNumber: null,
    category: null,
    source: { id: 'src-1', name: 'Fonte Teste' },
    municipalityLinks: [],
    requiredDocuments: [],
    aiAnalyses: [],
  };

  it('throws NotFoundException when the opportunity does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue(null);
    const service = new OpportunitiesService(prisma as any);

    await expect(service.findOne('missing')).rejects.toThrow(NotFoundException);
  });

  it('returns null latestAnalysis when there is no COMPLETED AIAnalysis', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue(BASE_OPPORTUNITY);
    const service = new OpportunitiesService(prisma as any);

    const result = await service.findOne('opp-1');

    expect(result.latestAnalysis).toBeNull();
    expect(
      prisma.opportunity.findUnique.mock.calls[0][0].include.aiAnalyses,
    ).toEqual({
      where: { status: 'COMPLETED' },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
  });

  it('maps the most recent COMPLETED analysis and municipality coordinates', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue({
      ...BASE_OPPORTUNITY,
      municipalityLinks: [
        {
          municipality: {
            id: 'mun-1',
            name: 'Curitiba',
            latitude: '-25.4284',
            longitude: '-49.2733',
          },
        },
      ],
      aiAnalyses: [
        {
          id: 'ana-1',
          model: 'gemini-3.5-flash-lite',
          promptVersion: 'v1',
          summary: 'Resumo',
          structuredResult: { titulo: 'X' },
          tokensInput: 100,
          tokensOutput: 50,
          createdAt: new Date('2026-01-01'),
        },
      ],
    });
    const service = new OpportunitiesService(prisma as any);

    const result = await service.findOne('opp-1');

    expect(result.latestAnalysis).toEqual(
      expect.objectContaining({
        id: 'ana-1',
        summary: 'Resumo',
        model: 'gemini-3.5-flash-lite',
      }),
    );
    expect(result.municipalities).toEqual([
      {
        id: 'mun-1',
        name: 'Curitiba',
        latitude: -25.4284,
        longitude: -49.2733,
      },
    ]);
  });
});
