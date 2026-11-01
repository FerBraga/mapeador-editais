import { Injectable, NotFoundException } from '@nestjs/common';
import { NoticeScraper } from '../contracts/notice-scraper.interface';
import { RawOpportunity, RawOpportunityDetails } from '../contracts/raw-opportunity.types';
import { fetchHtml } from './fundacao-araucaria-http-client';
import { FUNDACAO_ARAUCARIA_LISTING_URL, parseOpenCalls } from './fundacao-araucaria.mapper';

@Injectable()
export class FundacaoAraucariaScraper implements NoticeScraper {
  readonly sourceKey = 'fundacao-araucaria';

  private detailsByExternalId = new Map<string, RawOpportunityDetails>();

  async fetchOpportunities(): Promise<RawOpportunity[]> {
    const html = await fetchHtml(FUNDACAO_ARAUCARIA_LISTING_URL);
    const openCalls = parseOpenCalls(html, new Date());

    this.detailsByExternalId = new Map(openCalls.map((call) => [call.externalId, call]));

    return openCalls.map(({ externalId, title, officialUrl }) => ({
      externalId,
      title,
      officialUrl,
    }));
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
