import { NotFoundException } from '@nestjs/common';
import { GeolocationService } from '../geolocation.service';

function buildTx() {
  return {
    opportunityMunicipality: { deleteMany: jest.fn(), createMany: jest.fn() },
    opportunity: { update: jest.fn() },
  };
}

function buildPrismaMock() {
  const tx = buildTx();
  return {
    opportunity: { findUnique: jest.fn() },
    aIAnalysis: { findMany: jest.fn() },
    $transaction: jest.fn(
      async (callback: (tx: ReturnType<typeof buildTx>) => Promise<void>) =>
        callback(tx),
    ),
    tx,
  };
}

function buildQueueMock() {
  return { add: jest.fn().mockResolvedValue({ id: 'job-1' }) };
}

function buildMatcherMock(
  resolutions: Record<
    string,
    { municipalityId: string; name: string; similarity: number } | null
  >,
) {
  return {
    match: jest.fn((name: string) =>
      Promise.resolve(resolutions[name] ?? null),
    ),
  };
}

describe('GeolocationService.resolveOpportunity', () => {
  it('unions mentions across all COMPLETED analyses and resolves them', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1' });
    prisma.aIAnalysis.findMany.mockResolvedValue([
      { structuredResult: { municipiosContemplados: ['Curitiba'] } },
      {
        structuredResult: { municipiosContemplados: ['Cascavel', 'Curitiba'] },
      },
    ]);

    const matcher = buildMatcherMock({
      Curitiba: {
        municipalityId: 'mun-curitiba',
        name: 'Curitiba',
        similarity: 1,
      },
      Cascavel: {
        municipalityId: 'mun-cascavel',
        name: 'Cascavel',
        similarity: 1,
      },
    });

    const service = new GeolocationService(
      prisma as any,
      matcher as any,
      buildQueueMock() as any,
    );
    await service.resolveOpportunity('opp-1');

    expect(prisma.tx.opportunityMunicipality.deleteMany).toHaveBeenCalledWith({
      where: { opportunityId: 'opp-1' },
    });
    const created =
      prisma.tx.opportunityMunicipality.createMany.mock.calls[0][0].data;
    expect(created).toHaveLength(2);
    expect(created).toEqual(
      expect.arrayContaining([
        { opportunityId: 'opp-1', municipalityId: 'mun-curitiba' },
        { opportunityId: 'opp-1', municipalityId: 'mun-cascavel' },
      ]),
    );
    expect(prisma.tx.opportunity.update).toHaveBeenCalledWith({
      where: { id: 'opp-1' },
      data: { coversEntireState: false },
    });
  });

  it('marks coversEntireState without linking a specific municipality for a statewide mention', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1' });
    prisma.aIAnalysis.findMany.mockResolvedValue([
      { structuredResult: { municipiosContemplados: ['Paraná'] } },
    ]);

    const matcher = buildMatcherMock({});
    const service = new GeolocationService(
      prisma as any,
      matcher as any,
      buildQueueMock() as any,
    );
    await service.resolveOpportunity('opp-1');

    expect(matcher.match).not.toHaveBeenCalled();
    expect(prisma.tx.opportunityMunicipality.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.opportunity.update).toHaveBeenCalledWith({
      where: { id: 'opp-1' },
      data: { coversEntireState: true },
    });
  });

  it('leaves unmatched mentions unresolved without throwing', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1' });
    prisma.aIAnalysis.findMany.mockResolvedValue([
      {
        structuredResult: {
          municipiosContemplados: ['Região Metropolitana de Curitiba'],
        },
      },
    ]);

    const matcher = buildMatcherMock({});
    const service = new GeolocationService(
      prisma as any,
      matcher as any,
      buildQueueMock() as any,
    );
    await expect(service.resolveOpportunity('opp-1')).resolves.toBeUndefined();

    expect(prisma.tx.opportunityMunicipality.createMany).not.toHaveBeenCalled();
    expect(prisma.tx.opportunity.update).toHaveBeenCalledWith({
      where: { id: 'opp-1' },
      data: { coversEntireState: false },
    });
  });

  it('is idempotent: deletes the previous link set before recreating it on every run', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1' });
    prisma.aIAnalysis.findMany.mockResolvedValue([
      { structuredResult: { municipiosContemplados: ['Curitiba'] } },
    ]);

    const matcher = buildMatcherMock({
      Curitiba: {
        municipalityId: 'mun-curitiba',
        name: 'Curitiba',
        similarity: 1,
      },
    });
    const service = new GeolocationService(
      prisma as any,
      matcher as any,
      buildQueueMock() as any,
    );

    await service.resolveOpportunity('opp-1');
    await service.resolveOpportunity('opp-1');

    expect(prisma.tx.opportunityMunicipality.deleteMany).toHaveBeenCalledTimes(
      2,
    );
    expect(
      prisma.tx.opportunityMunicipality.createMany.mock.calls[1][0].data,
    ).toEqual([{ opportunityId: 'opp-1', municipalityId: 'mun-curitiba' }]);
  });

  it('skips resolution when the opportunity does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue(null);

    const service = new GeolocationService(
      prisma as any,
      buildMatcherMock({}) as any,
      buildQueueMock() as any,
    );
    await service.resolveOpportunity('missing');

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});

describe('GeolocationService.enqueueResolution', () => {
  it('throws NotFoundException when the opportunity does not exist', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue(null);

    const service = new GeolocationService(
      prisma as any,
      buildMatcherMock({}) as any,
      buildQueueMock() as any,
    );
    await expect(service.enqueueResolution('missing')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('enqueues a job and returns its id when the opportunity exists', async () => {
    const prisma = buildPrismaMock();
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1' });
    const queue = buildQueueMock();

    const service = new GeolocationService(
      prisma as any,
      buildMatcherMock({}) as any,
      queue as any,
    );
    const result = await service.enqueueResolution('opp-1');

    expect(queue.add).toHaveBeenCalledWith('resolve-opportunity', {
      opportunityId: 'opp-1',
    });
    expect(result).toEqual({ jobId: 'job-1' });
  });
});
