import { SourcesService } from '../sources.service';

describe('SourcesService.findAll', () => {
  it('returns only active sources ordered by name', async () => {
    const prisma = { source: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new SourcesService(prisma as any);

    await service.findAll();

    expect(prisma.source.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  });
});
