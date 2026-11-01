import { Injectable, NotFoundException } from '@nestjs/common';
import { NoticeScraper } from '../contracts/notice-scraper.interface';
import { RawOpportunity, RawOpportunityDetails } from '../contracts/raw-opportunity.types';
import { fetchPublicacoesByModalidade } from './pncp-pr.client';
import { filterStateLevel, toRawOpportunityDetails } from './pncp-pr.mapper';
import { MODALIDADES_CONTRATACAO } from './modalidades-contratacao';

const LOOKBACK_DAYS = 7;
const UF = 'PR';

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

@Injectable()
export class PncpPrScraper implements NoticeScraper {
  readonly sourceKey = 'pncp-pr';

  private detailsByExternalId = new Map<string, RawOpportunityDetails>();

  async fetchOpportunities(): Promise<RawOpportunity[]> {
    const dataFinal = new Date();
    const dataInicial = new Date(dataFinal);
    dataInicial.setDate(dataInicial.getDate() - LOOKBACK_DAYS);

    const allRecords: Awaited<ReturnType<typeof fetchPublicacoesByModalidade>> = [];
    for (const modalidade of MODALIDADES_CONTRATACAO) {
      const records = await fetchPublicacoesByModalidade({
        dataInicial: formatDate(dataInicial),
        dataFinal: formatDate(dataFinal),
        codigoModalidadeContratacao: modalidade.id,
        uf: UF,
      });
      allRecords.push(...records);
    }

    const stateLevelRecords = filterStateLevel(allRecords);
    const details = stateLevelRecords.map(toRawOpportunityDetails);

    this.detailsByExternalId = new Map(details.map((d) => [d.externalId, d]));

    return details.map(({ externalId, title, officialUrl }) => ({ externalId, title, officialUrl }));
  }

  async fetchOpportunityDetails(externalId: string): Promise<RawOpportunityDetails> {
    const details = this.detailsByExternalId.get(externalId);
    if (!details) {
      throw new NotFoundException(
        `No details captured for "${externalId}" — fetchOpportunities() must run first in the same execution`,
      );
    }
    return details;
  }
}
