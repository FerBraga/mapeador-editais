import { fetchJson } from './pncp-pr-http-client';
import { PaginaRetornoRecuperarCompraPublicacaoDTO, RecuperarCompraPublicacaoDTO } from './pncp-pr.types';

export const PNCP_CONSULTA_BASE_URL = 'https://pncp.gov.br/api/consulta';
const PAGE_SIZE = 50;

export type FetchPublicacoesParams = {
  dataInicial: string;
  dataFinal: string;
  codigoModalidadeContratacao: number;
  uf: string;
};

export async function fetchPublicacoesByModalidade(
  params: FetchPublicacoesParams,
): Promise<RecuperarCompraPublicacaoDTO[]> {
  const results: RecuperarCompraPublicacaoDTO[] = [];
  let pagina = 1;

  while (true) {
    const url = new URL(`${PNCP_CONSULTA_BASE_URL}/v1/contratacoes/publicacao`);
    url.searchParams.set('dataInicial', params.dataInicial);
    url.searchParams.set('dataFinal', params.dataFinal);
    url.searchParams.set('codigoModalidadeContratacao', String(params.codigoModalidadeContratacao));
    url.searchParams.set('uf', params.uf);
    url.searchParams.set('pagina', String(pagina));
    url.searchParams.set('tamanhoPagina', String(PAGE_SIZE));

    const response = await fetchJson<PaginaRetornoRecuperarCompraPublicacaoDTO | undefined>(
      url.toString(),
    );
    if (!response || response.data.length === 0) break;

    results.push(...response.data);

    if (pagina >= response.totalPaginas) break;
    pagina += 1;
  }

  return results;
}
