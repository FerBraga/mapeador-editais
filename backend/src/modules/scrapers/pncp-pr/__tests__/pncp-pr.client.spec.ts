import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fetchPublicacoesByModalidade } from '../pncp-pr.client';
import { fetchJson } from '../pncp-pr-http-client';

jest.mock('../pncp-pr-http-client', () => ({ fetchJson: jest.fn() }));

function fixture(name: string) {
  return JSON.parse(readFileSync(join(__dirname, '..', '__fixtures__', name), 'utf-8'));
}

describe('fetchPublicacoesByModalidade', () => {
  const mockedFetchJson = fetchJson as jest.Mock;

  beforeEach(() => {
    mockedFetchJson.mockReset();
  });

  it('aggregates all pages without making real network requests', async () => {
    mockedFetchJson
      .mockResolvedValueOnce(fixture('contratacoes-publicacao-page1.json'))
      .mockResolvedValueOnce(fixture('contratacoes-publicacao-page2-of-2.json'));

    const result = await fetchPublicacoesByModalidade({
      dataInicial: '20261001',
      dataFinal: '20261101',
      codigoModalidadeContratacao: 6,
      uf: 'PR',
    });

    expect(result).toHaveLength(3);
    expect(mockedFetchJson).toHaveBeenCalledTimes(2);

    const firstUrl = new URL(mockedFetchJson.mock.calls[0][0]);
    expect(firstUrl.searchParams.get('uf')).toBe('PR');
    expect(firstUrl.searchParams.get('codigoModalidadeContratacao')).toBe('6');
    expect(firstUrl.searchParams.get('pagina')).toBe('1');

    const secondUrl = new URL(mockedFetchJson.mock.calls[1][0]);
    expect(secondUrl.searchParams.get('pagina')).toBe('2');
  });

  it('returns an empty list when the API responds with no content (HTTP 204, empty body)', async () => {
    mockedFetchJson.mockResolvedValueOnce(undefined);

    const result = await fetchPublicacoesByModalidade({
      dataInicial: '20261001',
      dataFinal: '20261101',
      codigoModalidadeContratacao: 2,
      uf: 'PR',
    });

    expect(result).toEqual([]);
    expect(mockedFetchJson).toHaveBeenCalledTimes(1);
  });
});
