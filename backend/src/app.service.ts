import { Injectable } from '@nestjs/common';
import { PrismaService } from './shared/database/prisma.service';

export type HealthStatus = {
  status: 'ok' | 'error';
  database: 'ok' | 'error';
  timestamp: string;
};

@Injectable()
export class AppService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthStatus> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'ok', timestamp: new Date().toISOString() };
    } catch {
      return { status: 'error', database: 'error', timestamp: new Date().toISOString() };
    }
  }
}
