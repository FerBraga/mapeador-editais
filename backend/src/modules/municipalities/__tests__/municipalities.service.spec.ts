import { MunicipalitiesService } from '../municipalities.service';

describe('MunicipalitiesService.findAll', () => {
  it('maps coordinates to numbers and includes zero-count municipalities', async () => {
    const prisma = {
      municipality: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'mun-1',
            name: 'Curitiba',
            ibgeCode: '4106902',
            latitude: '-25.4284',
            longitude: '-49.2733',
            _count: { opportunityLinks: 3 },
          },
          {
            id: 'mun-2',
            name: 'Vila Sem Edital',
            ibgeCode: '0000000',
            latitude: '-24.0',
            longitude: '-50.0',
            _count: { opportunityLinks: 0 },
          },
        ]),
      },
    };
    const service = new MunicipalitiesService(prisma as any);

    const result = await service.findAll();

    expect(result).toEqual([
      {
        id: 'mun-1',
        name: 'Curitiba',
        ibgeCode: '4106902',
        latitude: -25.4284,
        longitude: -49.2733,
        opportunityCount: 3,
      },
      {
        id: 'mun-2',
        name: 'Vila Sem Edital',
        ibgeCode: '0000000',
        latitude: -24,
        longitude: -50,
        opportunityCount: 0,
      },
    ]);
    expect(prisma.municipality.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
      include: { _count: { select: { opportunityLinks: true } } },
    });
  });
});
