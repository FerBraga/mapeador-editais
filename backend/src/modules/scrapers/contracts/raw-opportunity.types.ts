export type RawOpportunity = {
  externalId: string;
  title: string;
  officialUrl: string;
};

export type RawAttachment = {
  url: string;
  label: string;
};

export type RawOpportunityDetails = RawOpportunity & {
  issuingOrganization?: string;
  description?: string;
  attachments: RawAttachment[];
};
