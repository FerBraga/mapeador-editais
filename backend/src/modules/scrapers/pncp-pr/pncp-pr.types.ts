export type PncpOrgaoEntidade = {
  cnpj: string;
  razaoSocial: string;
  esferaId: string;
};

export type RecuperarCompraPublicacaoDTO = {
  numeroControlePNCP: string;
  objetoCompra: string;
  anoCompra: number;
  sequencialCompra: number;
  orgaoEntidade: PncpOrgaoEntidade;
  situacaoCompraNome?: string;
  modalidadeNome?: string;
  dataAberturaProposta?: string;
  dataEncerramentoProposta?: string;
  dataPublicacaoPncp?: string;
  valorTotalEstimado?: number;
  valorTotalHomologado?: number;
  linkProcessoEletronico?: string | null;
  linkSistemaOrigem?: string | null;
};

export type PaginaRetornoRecuperarCompraPublicacaoDTO = {
  data: RecuperarCompraPublicacaoDTO[];
  totalRegistros: number;
  totalPaginas: number;
  numeroPagina: number;
};
