import { ScrapersService } from '../scrapers.service';
import { ScraperNormalizationService } from '../scraper-normalization.service';
import { NoticeScraper } from '../contracts/notice-scraper.interface';
import { RawOpportunity, RawOpportunityDetails } from '../contracts/raw-opportunity.types';

function buildPrismaMock() {
  return {
    source: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    scraperExecution: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    opportunity: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    document: {
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn((operations: unknown[]) => Promise.all(operations)),
  };
}

function buildQueueMock() {
  return { add: jest.fn() };
}

function buildDocumentsServiceMock() {
  return { enqueueNewDocument: jest.fn() };
}

class FakeScraper implements NoticeScraper {
  readonly sourceKey = 'fake-source';

  constructor(
    private readonly opportunities: RawOpportunity[],
    private readonly detailsByExternalId: Record<string, RawOpportunityDetails | Error>,
  ) {}

  async fetchOpportunities(): Promise<RawOpportunity[]> {
    return this.opportunities;
  }

  async fetchOpportunityDetails(externalId: string): Promise<RawOpportunityDetails> {
    const result = this.detailsByExternalId[externalId];
    if (result instanceof Error) throw result;
    return result;
  }
}

const SOURCE = { id: 'source-1', scraperKey: 'fake-source' };

describe('ScrapersService', () => {
  it('creates a new opportunity and its attachments when none existed before', async () => {
    const prisma = buildPrismaMock();
    prisma.source.findUnique.mockResolvedValue(SOURCE);
    prisma.scraperExecution.findFirst.mockResolvedValue(null);
    prisma.scraperExecution.create.mockResolvedValue({ id: 'exec-1' });
    prisma.opportunity.findUnique.mockResolvedValue(null);
    prisma.opportunity.create.mockResolvedValue({ id: 'opp-1' });
    prisma.document.findFirst.mockResolvedValue(null);
    prisma.document.create.mockResolvedValue({ id: 'doc-1' });

    const scraper = new FakeScraper(
      [{ externalId: 'ext-1', title: 'Edital 1', officialUrl: 'https://example.test/1' }],
      {
        'ext-1': {
          externalId: 'ext-1',
          title: 'Edital 1',
          officialUrl: 'https://example.test/1',
          attachments: [{ url: 'https://example.test/1.pdf', label: 'Anexo' }],
        },
      },
    );

    const documents = buildDocumentsServiceMock();
    const service = new ScrapersService(
      prisma as any,
      new ScraperNormalizationService(),
      documents as any,
      [scraper],
      buildQueueMock() as any,
    );

    const summary = await service.runSource('fake-source');

    expect(summary.status).toBe('COMPLETED');
    expect(summary.itemsCreated).toBe(1);
    expect(prisma.opportunity.create).toHaveBeenCalledTimes(1);
    expect(documents.enqueueNewDocument).toHaveBeenCalledWith('doc-1');
    expect(prisma.document.create).toHaveBeenCalledTimes(1);
  });

  it('does not duplicate or needlessly update an opportunity whose content is unchanged', async () => {
    const prisma = buildPrismaMock();
    prisma.source.findUnique.mockResolvedValue(SOURCE);
    prisma.scraperExecution.findFirst.mockResolvedValue(null);
    prisma.scraperExecution.create.mockResolvedValue({ id: 'exec-1' });

    const normalization = new ScraperNormalizationService();
    const details: RawOpportunityDetails = {
      externalId: 'ext-1',
      title: 'Edital 1',
      officialUrl: 'https://example.test/1',
      attachments: [],
    };
    const existingContentHash = normalization.normalize(details).contentHash;
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1', contentHash: existingContentHash });

    const scraper = new FakeScraper(
      [{ externalId: 'ext-1', title: 'Edital 1', officialUrl: 'https://example.test/1' }],
      { 'ext-1': details },
    );

    const service = new ScrapersService(
      prisma as any,
      normalization,
      buildDocumentsServiceMock() as any,
      [scraper],
      buildQueueMock() as any,
    );

    const summary = await service.runSource('fake-source');

    expect(summary.itemsCreated).toBe(0);
    expect(summary.itemsUpdated).toBe(0);
    expect(prisma.opportunity.create).not.toHaveBeenCalled();
    expect(prisma.opportunity.update).toHaveBeenCalledWith({
      where: { id: 'opp-1' },
      data: { lastScrapedAt: expect.any(Date) },
    });
    expect(prisma.document.create).not.toHaveBeenCalled();
  });

  it('updates an opportunity whose content changed since the last scrape', async () => {
    const prisma = buildPrismaMock();
    prisma.source.findUnique.mockResolvedValue(SOURCE);
    prisma.scraperExecution.findFirst.mockResolvedValue(null);
    prisma.scraperExecution.create.mockResolvedValue({ id: 'exec-1' });
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1', contentHash: 'stale-hash' });
    prisma.document.findFirst.mockResolvedValue(null);

    const scraper = new FakeScraper(
      [{ externalId: 'ext-1', title: 'Edital 1 atualizado', officialUrl: 'https://example.test/1' }],
      {
        'ext-1': {
          externalId: 'ext-1',
          title: 'Edital 1 atualizado',
          officialUrl: 'https://example.test/1',
          attachments: [],
        },
      },
    );

    const service = new ScrapersService(
      prisma as any,
      new ScraperNormalizationService(),
      buildDocumentsServiceMock() as any,
      [scraper],
      buildQueueMock() as any,
    );

    const summary = await service.runSource('fake-source');

    expect(summary.itemsUpdated).toBe(1);
    expect(prisma.opportunity.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'opp-1' },
        data: expect.objectContaining({ title: 'Edital 1 atualizado' }),
      }),
    );
  });

  it('does not enqueue processing for an attachment whose document already exists', async () => {
    const prisma = buildPrismaMock();
    prisma.source.findUnique.mockResolvedValue(SOURCE);
    prisma.scraperExecution.findFirst.mockResolvedValue(null);
    prisma.scraperExecution.create.mockResolvedValue({ id: 'exec-1' });
    prisma.opportunity.findUnique.mockResolvedValue({ id: 'opp-1', contentHash: 'stale-hash' });
    prisma.document.findFirst.mockResolvedValue({ id: 'existing-doc' });

    const scraper = new FakeScraper(
      [{ externalId: 'ext-1', title: 'Edital 1 atualizado', officialUrl: 'https://example.test/1' }],
      {
        'ext-1': {
          externalId: 'ext-1',
          title: 'Edital 1 atualizado',
          officialUrl: 'https://example.test/1',
          attachments: [{ url: 'https://example.test/1.pdf', label: 'Anexo' }],
        },
      },
    );

    const documents = buildDocumentsServiceMock();
    const service = new ScrapersService(
      prisma as any,
      new ScraperNormalizationService(),
      documents as any,
      [scraper],
      buildQueueMock() as any,
    );

    await service.runSource('fake-source');

    expect(prisma.document.create).not.toHaveBeenCalled();
    expect(documents.enqueueNewDocument).not.toHaveBeenCalled();
  });

  it('keeps processing remaining items and marks the execution as partially completed when one item fails', async () => {
    const prisma = buildPrismaMock();
    prisma.source.findUnique.mockResolvedValue(SOURCE);
    prisma.scraperExecution.findFirst.mockResolvedValue(null);
    prisma.scraperExecution.create.mockResolvedValue({ id: 'exec-1' });
    prisma.opportunity.findUnique.mockResolvedValue(null);
    prisma.opportunity.create.mockResolvedValue({ id: 'opp-ok' });
    prisma.document.findFirst.mockResolvedValue(null);

    const scraper = new FakeScraper(
      [
        { externalId: 'broken', title: 'Edital quebrado', officialUrl: 'https://example.test/broken' },
        { externalId: 'ok', title: 'Edital ok', officialUrl: 'https://example.test/ok' },
      ],
      {
        broken: new Error('Unexpected page structure'),
        ok: {
          externalId: 'ok',
          title: 'Edital ok',
          officialUrl: 'https://example.test/ok',
          attachments: [],
        },
      },
    );

    const service = new ScrapersService(
      prisma as any,
      new ScraperNormalizationService(),
      buildDocumentsServiceMock() as any,
      [scraper],
      buildQueueMock() as any,
    );

    const summary = await service.runSource('fake-source');

    expect(summary.status).toBe('PARTIALLY_COMPLETED');
    expect(summary.itemsFound).toBe(2);
    expect(summary.itemsCreated).toBe(1);
    expect(prisma.opportunity.create).toHaveBeenCalledTimes(1);
    const updateCall = prisma.scraperExecution.update.mock.calls[0][0];
    expect(updateCall.data.status).toBe('PARTIALLY_COMPLETED');
    expect(updateCall.data.errorMessage).toContain('broken');
  });

  it('rejects a new run while one is already in progress for the same source', async () => {
    const prisma = buildPrismaMock();
    prisma.source.findUnique.mockResolvedValue(SOURCE);
    prisma.scraperExecution.findFirst.mockResolvedValue({ id: 'running-exec' });

    const scraper = new FakeScraper([], {});
    const service = new ScrapersService(
      prisma as any,
      new ScraperNormalizationService(),
      buildDocumentsServiceMock() as any,
      [scraper],
      buildQueueMock() as any,
    );

    await expect(service.runSource('fake-source')).rejects.toThrow(/already running/);
    expect(prisma.scraperExecution.create).not.toHaveBeenCalled();
  });
});
