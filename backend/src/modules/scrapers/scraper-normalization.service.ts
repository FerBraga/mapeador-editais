import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { RawOpportunityDetails } from './contracts/raw-opportunity.types';
import { NormalizedOpportunity } from './contracts/normalized-opportunity.types';

@Injectable()
export class ScraperNormalizationService {
  normalize(details: RawOpportunityDetails): NormalizedOpportunity {
    const attachments = details.attachments.map((attachment) => ({
      originalFilename: attachment.label || this.filenameFromUrl(attachment.url),
      sourceUrl: attachment.url,
    }));

    const hashInput = JSON.stringify({
      title: details.title,
      officialUrl: details.officialUrl,
      issuingOrganization: details.issuingOrganization ?? null,
      description: details.description ?? null,
      attachmentUrls: attachments.map((a) => a.sourceUrl).sort(),
    });

    return {
      externalId: details.externalId,
      title: details.title,
      officialUrl: details.officialUrl,
      issuingOrganization: details.issuingOrganization,
      description: details.description,
      contentHash: createHash('sha256').update(hashInput).digest('hex'),
      rawData: {
        title: details.title,
        officialUrl: details.officialUrl,
        issuingOrganization: details.issuingOrganization ?? null,
        description: details.description ?? null,
        attachments: details.attachments,
      },
      attachments,
    };
  }

  private filenameFromUrl(url: string): string {
    try {
      const { pathname } = new URL(url);
      return decodeURIComponent(pathname.split('/').pop() || url);
    } catch {
      return url;
    }
  }
}
