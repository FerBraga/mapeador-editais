import { CategoriesService } from '../categories.service';

describe('CategoriesService.findAll', () => {
  it('returns only active categories ordered by name', async () => {
    const prisma = { category: { findMany: jest.fn().mockResolvedValue([]) } };
    const service = new CategoriesService(prisma as any);

    await service.findAll();

    expect(prisma.category.findMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  });
});
