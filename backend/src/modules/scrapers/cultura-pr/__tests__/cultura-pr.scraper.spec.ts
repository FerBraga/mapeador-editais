import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { CulturaPrScraper } from '../cultura-pr.scraper';
import { fetchHtml } from '../cultura-pr-http-client';

jest.mock('../cultura-pr-http-client', () => ({ fetchHtml: jest.fn() }));

function fixture(name: string): string {
  return readFileSync(join(__dirname, '..', '__fixtures__', name), 'utf-8');
}

describe('CulturaPrScraper', () => {
  const mockedFetchHtml = fetchHtml as jest.Mock;

  beforeEach(() => {
    mockedFetchHtml.mockReset();
  });

  it('fetches opportunities without making real network requests', async () => {
    mockedFetchHtml.mockResolvedValue(fixture('home-with-open-editais-menu.html'));

    const scraper = new CulturaPrScraper();
    const result = await scraper.fetchOpportunities();

    expect(result).toHaveLength(3);
    expect(mockedFetchHtml).toHaveBeenCalledWith('https://www.cultura.pr.gov.br');
  });

  it('fetches opportunity details without making real network requests', async () => {
    mockedFetchHtml.mockResolvedValue(fixture('edital-movceu-parana.html'));

    const scraper = new CulturaPrScraper();
    const result = await scraper.fetchOpportunityDetails('Edital-MOVCEU-Parana');

    expect(result.title).toBe('Edital MOVCEU Paraná');
    expect(mockedFetchHtml).toHaveBeenCalledWith(
      'https://www.cultura.pr.gov.br/Pagina/Edital-MOVCEU-Parana',
    );
  });
});
