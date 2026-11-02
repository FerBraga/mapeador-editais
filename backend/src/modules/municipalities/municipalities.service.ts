import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class MunicipalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const municipalities = await this.prisma.municipality.findMany({
      orderBy: { name: 'asc' },
      include: { _count: { select: { opportunityLinks: true } } },
    });

    return municipalities.map((municipality) => ({
      id: municipality.id,
      name: municipality.name,
      ibgeCode: municipality.ibgeCode,
      latitude: Number(municipality.latitude),
      longitude: Number(municipality.longitude),
      opportunityCount: municipality._count.opportunityLinks,
    }));
  }
}
