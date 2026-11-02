import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../shared/database/prisma.service';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.source.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }
}
