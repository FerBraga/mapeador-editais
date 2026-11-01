import { RawOpportunity, RawOpportunityDetails } from './raw-opportunity.types';

export interface NoticeScraper {
  readonly sourceKey: string;

  fetchOpportunities(): Promise<RawOpportunity[]>;

  fetchOpportunityDetails(externalId: string): Promise<RawOpportunityDetails>;
}

export const NOTICE_SCRAPERS = Symbol('NOTICE_SCRAPERS');
