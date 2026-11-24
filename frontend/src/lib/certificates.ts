export interface CertificateShortcut {
  name: string
  description: string
  url: string
}

export interface CertificateGroup {
  id: string
  title: string
  shortcuts: CertificateShortcut[]
}

/**
 * Static reference data - official certidão portals change rarely, and the
 * MVP has no admin panel to edit this kind of content, so it lives as a
 * constant here instead of a database table. URLs were verified against
 * official sources (gov.br, Caixa, TST, SEFA-PR) when written; worth
 * re-checking periodically since government sites restructure.
 */
export const CERTIFICATE_GROUPS: CertificateGroup[] = [
  {
    id: 'fiscal',
    title: 'Certidões fiscais',
    shortcuts: [
      {
        name: 'Certidão Negativa de Débitos Federais (Receita Federal/PGFN)',
        description: 'Comprova regularidade com tributos federais e com a Dívida Ativa da União.',
        url: 'https://www.gov.br/pt-br/servicos/emitir-certidao-de-regularidade-fiscal-perante-a-fazenda-nacional',
      },
      {
        name: 'Certidão Negativa Estadual (Paraná)',
        description: 'Comprova regularidade com tributos e dívida ativa do Estado do Paraná.',
        url: 'https://www.fazenda.pr.gov.br/servicos/Economia-e-Financas/Certidoes/Emitir-Certidao-Negativa-Receita-Estadual-kZrX5gol',
      },
    ],
  },
  {
    id: 'fgts',
    title: 'FGTS',
    shortcuts: [
      {
        name: 'Certificado de Regularidade do FGTS (CRF)',
        description: 'Comprova regularidade da empresa com o Fundo de Garantia do Tempo de Serviço.',
        url: 'https://consulta-crf.caixa.gov.br',
      },
    ],
  },
  {
    id: 'trabalhista',
    title: 'Trabalhista',
    shortcuts: [
      {
        name: 'Certidão Negativa de Débitos Trabalhistas (CNDT)',
        description: 'Comprova a inexistência de débitos trabalhistas reconhecidos pela Justiça do Trabalho.',
        url: 'https://www.tst.jus.br/certidao',
      },
    ],
  },
]

export const MUNICIPAL_CERTIFICATE_GUIDANCE =
  'Cada prefeitura do Paraná emite sua própria certidão negativa municipal, geralmente pelo site da Secretaria de Fazenda ou Finanças do município. Busque por "certidão negativa" + o nome do seu município, ou procure diretamente no site oficial da prefeitura onde sua organização está sediada.'
