## Context

O `scraper-framework` (`backend/src/modules/scrapers/`) já existe e foi validado com uma fonte real (Cultura SEEC-PR). Esta change adiciona duas fontes novas sem alterar a interface `NoticeScraper` nem a orquestração/dedup/lock existentes. A novidade estrutural é que uma das duas fontes (PNCP) não é scraping de HTML — é consumo de uma API JSON pública — então o `NoticeScraper` precisa comportar implementações cujo "fetch" interno é uma chamada de API em vez de Cheerio sobre HTML. Como a interface já é agnóstica a isso (`fetchOpportunities()`/`fetchOpportunityDetails()` apenas retornam dados brutos tipados), nenhuma mudança de contrato é necessária.

## Goals / Non-Goals

**Goals:**
- Scraper funcional da Fundação Araucária, reutilizando 100% do `scraper-framework`.
- Cliente de integração funcional com a API de consulta do PNCP, filtrado para `uf=PR`, cobrindo as modalidades de contratação conhecidas, também reutilizando o `scraper-framework` sem alterações.
- Ambas as fontes com testes automatizados sem acesso de rede real, seguindo o padrão de `cultura-pr/`.
- Validação manual contra os sistemas reais.

**Non-Goals:**
- Resolver ou contornar o captcha do GMS (fora de escopo permanentemente, por ser uma barreira técnica/ética deliberada do sistema de origem).
- Download/extração de documentos, análise por IA, geocodificação.
- Cobertura de todas as modalidades de contratação do PNCP com 100% de certeza taxonômica — usar a tabela de códigos publicamente documentada pelo PNCP e tratar modalidades desconhecidas como lacuna aceitável do MVP, não bloqueante.

## Decisions

**Fundação Araucária: tratar a própria listagem como "detalhe".** Como o site não tem página própria por chamada (edital e anexos ficam inline na listagem única em `/Programas-Abertos`), `fetchOpportunities()` já captura e armazena internamente (em memória, durante a execução) os dados completos de cada item, incluindo anexos. `fetchOpportunityDetails(externalId)` apenas retorna o item correspondente dessa mesma captura — sem fazer uma segunda requisição HTTP. Alternativa considerada: tratar como erro por "falta de página de detalhe" — rejeitada porque o `NoticeScraper` não exige que `fetchOpportunityDetails` faça uma requisição nova, apenas que retorne os dados completos.

**Fundação Araucária: filtrar itens vencidos pela data de inscrição informada no texto da listagem.** A listagem mistura chamadas abertas e já encerradas (confirmado no levantamento técnico). O scraper deve extrair a data final de inscrição do texto de cada item (padrão textual como "Inscrições: De DD/MM/AAAA até DD/MM/AAAA" ou "Até DD/MM/AA") e descartar itens cuja data final já passou, antes de retorná-los em `fetchOpportunities()`. Itens sem data de inscrição clara (ex.: "fluxo contínuo") são considerados abertos por padrão. Alternativa considerada: capturar tudo e deixar o filtro de "aberto/fechado" para uma change futura de geolocalização/API — rejeitada porque poluiria o banco com dezenas de chamadas já encerradas desde o primeiro dia, sem nenhum valor para o usuário final.

**Identificador externo (`externalId`) da Fundação Araucária derivado do código da chamada (ex.: "CP-20-2026"), não da URL.** Diferente da Cultura SEEC-PR, não há uma URL de página própria para derivar um slug. O texto da listagem sempre inclui um código de identificação da chamada (ex.: "CP 20/26", "PI 16/26"); o scraper normaliza esse código (remove espaços, uniformiza separador) para usar como `externalId`, garantindo estabilidade entre execuções.

**PNCP: iterar sobre a tabela oficial de códigos de modalidade de contratação.** O parâmetro `codigoModalidadeContratacao` é obrigatório na API de consulta (`/v1/contratacoes/publicacao`) e não vem com enum no OpenAPI dela. A tabela real (19 modalidades, IDs 1–19) foi obtida diretamente do endpoint de domínio oficial do PNCP (`GET https://pncp.gov.br/api/pncp/v1/modalidades`, consultado em 2026-11-01) e congelada em `pncp-pr/data/modalidades-contratacao.json` — não é uma suposição nem uma tabela de memória. O cliente itera sobre esses 19 IDs para cobrir todas as modalidades vigentes, fazendo uma chamada paginada por modalidade e por execução. Alternativa considerada: usar um único código "genérico" — rejeitada porque a API não oferece essa opção; o parâmetro é estritamente obrigatório por modalidade específica. Observação: o endpoint de domínio (`/api/pncp/v1/modalidades`) pertence a um módulo de API diferente do endpoint de consulta usado para os dados (`/api/consulta/v1/...`) — ambos públicos, sem autenticação, mas com bases de rota distintas.

**PNCP: `externalId` = `numeroControlePNCP`.** Esse campo é o identificador único global do PNCP para a contratação (gerado pelo próprio sistema nacional), estável e com formato documentado — a escolha natural para deduplicação, sem necessidade de derivar nada de uma URL.

**PNCP: `fetchOpportunityDetails` reaproveita os dados já obtidos em `fetchOpportunities`, sem uma segunda chamada de API.** O DTO retornado por `/v1/contratacoes/publicacao` já traz praticamente todos os campos relevantes (objeto, datas, valores, órgão, situação, link do processo eletrônico). Um endpoint de detalhe separado (`/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}`) existe e traria alguns campos adicionais marginais (ex.: `existeResultado`), mas não justifica dobrar o número de chamadas à API por execução. Mesmo padrão adotado para a Fundação Araucária.

**PNCP: sem download de anexos nesta change.** A API de consulta usada (`/v1/contratacoes/publicacao` e `/v1/orgaos/{cnpj}/compras/{ano}/{sequencial}`) não expõe uma lista de documentos/anexos da contratação dentro do schema investigado; o endpoint de documentos do PNCP faz parte de um módulo de API diferente (API de integração, não a de consulta) cujo acesso não foi confirmado nesta change. O campo `linkProcessoEletronico` (quando presente) é preservado em `rawData` para referência futura. Registrar isso como lacuna conhecida, não como bloqueio — o `Document`/anexo desta fonte pode ficar vazio no MVP sem quebrar o fluxo (o `scraper-framework` já trata anexos como lista opcional).

**PNCP: filtrar apenas órgãos estaduais (`orgaoEntidade.esferaId === 'E'`), descartando municípios.** O parâmetro `uf=PR` da API retorna licitações de **todos** os entes do Paraná — estado e os 399 municípios — e um teste real mostrou ~3.700 registros apenas na modalidade Pregão Eletrônico em um mês. Isso é um volume muito maior que o escopo original do planejamento ("Compras Paraná" = GMS do governo estadual) e geraria ruído de baixo valor (compras municipais de pequeno porte) desde o primeiro dia. **Decisão confirmada com o usuário**: manter o escopo equivalente ao original — apenas órgãos com `esferaId = "E"` (estadual). Como a API não expõe um parâmetro de esfera administrativa, o filtro é aplicado no cliente (client-side), após a paginação, descartando os registros municipais antes de retornar a lista normalizada. Município pode ser reavaliado como fonte própria em change futura, se houver demanda.

**PNCP: tratar HTTP 429 com backoff progressivo, não como falha imediata.** Validação manual mostrou que a API do PNCP aplica rate limiting (HTTP 429) quando muitas páginas são requisitadas em sequência rápida, sem expor headers `Retry-After`. O cliente trata 429 como um caso retomável: aguarda um backoff progressivo (3s × tentativa) e tenta novamente, até 5 tentativas, antes de desistir. Também corrigido: a API retorna HTTP 204 com corpo vazio (não `{"data":[]}`) quando uma modalidade não tem nenhum resultado no período — o cliente trata isso como lista vazia, não como erro de parsing.

**PNCP: consumo via `fetch` nativo com `Accept: application/json`, sem Cheerio.** Diferente das fontes de scraping HTML, aqui não há parsing de DOM — a resposta já vem estruturada. Isola essa diferença dentro do próprio módulo da fonte (`pncp-pr/pncp-pr.client.ts`), mantendo o `scraper-framework` agnóstico ao formato de origem.

## Risks / Trade-offs

- [Tabela de códigos de modalidade do PNCP (congelada em 2026-11-01) pode ficar desatualizada se o PNCP adicionar novas modalidades] → Tabela documentada com a fonte e a data de consulta no próprio arquivo de dados; revisão periódica é um ajuste de baixo custo (atualizar o JSON), não uma mudança estrutural.
- [Filtro de "data de inscrição vencida" da Fundação Araucária depende de parsing de texto livre, sujeito a variações de formatação no site] → Cobrir os formatos observados com testes de fixture; itens com data não reconhecida ficam como "abertos por padrão" (fail-open para não perder oportunidades reais, mesmo que isso ocasionalmente deixe um item vencido passar).
- [PNCP pode ter outras UFs/órgãos homônimos cujo filtro `uf=PR` não capture 100% das compras relevantes ao estado, caso algum órgão estadual publique sob outro agrupamento] → Aceitável no MVP; validar manualmente a amostra de órgãos retornados e documentar qualquer lacuna percebida.
- [Ausência de anexos para a fonte PNCP reduz o valor imediato do checklist de documentos para essa fonte] → Aceito como lacuna conhecida; o campo `linkProcessoEletronico` preservado em `rawData` permite investigação manual/futura sem perda de rastreabilidade.

## Open Questions

- Confirmar, em uma change futura (pipeline de documentos ou uma revisão desta), se existe de fato um endpoint público de documentos/anexos do PNCP acessível sem autenticação adicional, e se vale a pena consumi-lo.
- Avaliar se o GMS do Compras Paraná publicará futuramente uma API sem captcha; se isso ocorrer, pode-se reavaliar incluir essa fonte além do PNCP (não em substituição).
