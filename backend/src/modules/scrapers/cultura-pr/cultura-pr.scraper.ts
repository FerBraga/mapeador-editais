import { Injectable } from '@nestjs/common';
import { NoticeScraper } from '../contracts/notice-scraper.interface';
import { RawOpportunity, RawOpportunityDetails } from '../contracts/raw-opportunity.types';
import { fetchHtml } from './cultura-pr-http-client';
import { CULTURA_PR_BASE_URL, parseOpenNoticesFromHome, parseOpportunityDetail } from './cultura-pr.mapper';

@Injectable()
export class CulturaPrScraper implements NoticeScraper {
  readonly sourceKey = 'cultura-pr';

  async fetchOpportunities(): Promise<RawOpportunity[]> {
    const html = await fetchHtml(CULTURA_PR_BASE_URL);
    return parseOpenNoticesFromHome(html);
  }

  async fetchOpportunityDetails(externalId: string): Promise<RawOpportunityDetails> {
    const officialUrl = `${CULTURA_PR_BASE_URL}/Pagina/${externalId}`;
    const html = await fetchHtml(officialUrl);
    return parseOpportunityDetail(html, externalId, officialUrl);
  }
}
