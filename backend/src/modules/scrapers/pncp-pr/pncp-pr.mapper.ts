import { RawOpportunityDetails } from '../contracts/raw-opportunity.types';
import { RecuperarCompraPublicacaoDTO } from './pncp-pr.types';

const STATE_LEVEL_ESFERA_ID = 'E';

export function filterStateLevel(records: RecuperarCompraPublicacaoDTO[]): RecuperarCompraPublicacaoDTO[] {
  return records.filter((record) => record.orgaoEntidade.esferaId === STATE_LEVEL_ESFERA_ID);
}

export function toRawOpportunityDetails(record: RecuperarCompraPublicacaoDTO): RawOpportunityDetails {
  return {
    externalId: record.numeroControlePNCP,
    title: record.objetoCompra,
    // Falls back to the real API detail endpoint (not a guessed viewer URL) when no process link is published.
    officialUrl:
      record.linkProcessoEletronico ||
      record.linkSistemaOrigem ||
      `https://pncp.gov.br/api/consulta/v1/orgaos/${record.orgaoEntidade.cnpj}/compras/${record.anoCompra}/${record.sequencialCompra}`,
    issuingOrganization: record.orgaoEntidade.razaoSocial,
    description: record.modalidadeNome ? `Modalidade: ${record.modalidadeNome}` : undefined,
    attachments: [],
  };
}
