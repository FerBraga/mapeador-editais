import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { filterStateLevel, toRawOpportunityDetails } from '../pncp-pr.mapper';
import { RecuperarCompraPublicacaoDTO } from '../pncp-pr.types';

function fixture(name: string): { data: RecuperarCompraPublicacaoDTO[] } {
  return JSON.parse(readFileSync(join(__dirname, '..', '__fixtures__', name), 'utf-8'));
}

describe('filterStateLevel', () => {
  it('keeps only state-level (esferaId "E") records, discarding municipal ones', () => {
    const { data } = fixture('contratacoes-publicacao-page1.json');

    const result = filterStateLevel(data);

    expect(result).toHaveLength(1);
    expect(result[0].orgaoEntidade.esferaId).toBe('E');
    expect(result[0].orgaoEntidade.razaoSocial).toContain('FUNEAS');
  });
});

describe('toRawOpportunityDetails', () => {
  it('maps a record with a published process link', () => {
    const { data } = fixture('contratacoes-publicacao-page1.json');
    const stateRecord = data.find((r) => r.orgaoEntidade.esferaId === 'E')!;

    const result = toRawOpportunityDetails(stateRecord);

    expect(result.externalId).toBe(stateRecord.numeroControlePNCP);
    expect(result.title).toBe(stateRecord.objetoCompra);
    expect(result.officialUrl).toBe(stateRecord.linkProcessoEletronico);
    expect(result.issuingOrganization).toContain('FUNEAS');
    expect(result.attachments).toEqual([]);
  });

  it('falls back to the API detail endpoint when no process/sistema link is published', () => {
    const record: RecuperarCompraPublicacaoDTO = {
      numeroControlePNCP: '00000000000000-1-000001/2026',
      objetoCompra: 'Objeto de teste',
      anoCompra: 2026,
      sequencialCompra: 1,
      orgaoEntidade: { cnpj: '00000000000000', razaoSocial: 'Órgão Teste', esferaId: 'E' },
      linkProcessoEletronico: null,
      linkSistemaOrigem: null,
    };

    const result = toRawOpportunityDetails(record);

    expect(result.officialUrl).toBe(
      'https://pncp.gov.br/api/consulta/v1/orgaos/00000000000000/compras/2026/1',
    );
  });
});
