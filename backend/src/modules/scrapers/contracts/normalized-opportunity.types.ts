export type NormalizedAttachment = {
  originalFilename: string;
  sourceUrl: string;
};

export type NormalizedOpportunity = {
  externalId: string;
  title: string;
  officialUrl: string;
  issuingOrganization?: string;
  description?: string;
  contentHash: string;
  rawData: Record<string, unknown>;
  attachments: NormalizedAttachment[];
};
