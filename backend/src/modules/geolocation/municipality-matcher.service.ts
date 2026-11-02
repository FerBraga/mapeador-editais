import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../shared/database/prisma.service';
import { Env } from '../../shared/config/env.schema';
import { normalizeMunicipalityName } from './text-normalization';

export interface MunicipalityMatch {
  municipalityId: string;
  name: string;
  similarity: number;
}

@Injectable()
export class MunicipalityMatcherService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  /**
   * Deterministic matching against the real municipality gazetteer: exact
   * match (post-normalization) first, trigram similarity fallback above the
   * configured threshold. Returns null rather than guessing when nothing
   * clears the threshold - never force a low-confidence match.
   */
  async match(rawName: string): Promise<MunicipalityMatch | null> {
    const normalized = normalizeMunicipalityName(rawName);
    if (!normalized) return null;

    const exact = await this.prisma.$queryRaw<
      Array<{ id: string; name: string }>
    >`
      SELECT id, name FROM municipalities
      WHERE lower(unaccent(name)) = ${normalized}
      LIMIT 1
    `;
    if (exact.length > 0) {
      return {
        municipalityId: exact[0].id,
        name: exact[0].name,
        similarity: 1,
      };
    }

    const threshold = this.config.get('GEOLOCATION_MATCH_THRESHOLD', {
      infer: true,
    });
    const fuzzy = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; sim: number }>
    >`
      SELECT id, name, similarity(lower(unaccent(name)), ${normalized}) AS sim
      FROM municipalities
      ORDER BY sim DESC
      LIMIT 1
    `;
    if (fuzzy.length > 0 && fuzzy[0].sim >= threshold) {
      return {
        municipalityId: fuzzy[0].id,
        name: fuzzy[0].name,
        similarity: fuzzy[0].sim,
      };
    }

    return null;
  }
}
