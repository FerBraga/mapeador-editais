## 1. Scraper da Fonte Fundação Araucária

- [x] 1.1 Criar registro `Source` (via seed) para "Fundação Araucária" com `baseUrl = https://www.fappr.pr.gov.br`, `sourceType = INNOVATION`, `scraperKey = fundacao-araucaria`
- [x] 1.2 Implementar `fundacao-araucaria-http-client.ts` com rate limiting e `User-Agent` próprio, seguindo o padrão de `cultura-pr-http-client.ts`
- [x] 1.3 Implementar `fundacao-araucaria.mapper.ts`: parsing da listagem única em `/Programas-Abertos`, extraindo por item o código de identificação (ex.: "CP 20/26"), texto/título, datas de inscrição informadas e links de anexos (PDF/DOCX) — estrutura real confirmada: `.row.two-col-right` com `.col-main` (h3 código+título, anexos) e `.col-sidebar` (Resp./Setor Resp., datas de inscrição)
- [x] 1.4 Implementar parser de datas a partir do texto livre ("Inscrições: De DD/MM/AAAA até DD/MM/AAAA", "até DD/MM/AAAA", "Fluxo Contínuo") e lógica de filtragem de itens vencidos
- [x] 1.5 Implementar derivação de `externalId` a partir do código de identificação da chamada, normalizado (ex.: "CP 20/26" → "cp-20-26"; "PA Argentina" → "pa-argentina") — preservado sem lowercase forçado de acentos via NFD, mantendo estabilidade entre execuções
- [x] 1.6 Implementar `fundacao-araucaria.scraper.ts`: `fetchOpportunities()` busca e filtra a listagem; `fetchOpportunityDetails(externalId)` retorna os dados já capturados na mesma leitura (cache em `Map`), sem nova requisição HTTP
- [x] 1.7 Registrar o scraper no array `NOTICE_SCRAPERS` de `scrapers.module.ts` e adicionar `fundacao-araucaria` a `DAILY_SCRAPER_KEYS`

## 2. Fonte PNCP/PR (substitui o GMS do Compras Paraná)

- [x] 2.1 Criar registro `Source` (via seed) para "Compras Públicas PR (PNCP)" com `baseUrl = https://pncp.gov.br/api/consulta`, `sourceType = PUBLIC_PROCUREMENT`, `scraperKey = pncp-pr`
- [x] 2.2 Congelar a tabela oficial de modalidades de contratação em `pncp-pr/modalidades-contratacao.ts` (constante TS, não JSON — evita problemas de cópia de assets para `dist/` no build do NestJS) — já obtida de `GET https://pncp.gov.br/api/pncp/v1/modalidades` em 2026-11-01, 19 modalidades, com fonte/data documentada no próprio arquivo
- [x] 2.3 Implementar `pncp-pr.client.ts`: cliente HTTP para `GET /v1/contratacoes/publicacao` com `uf=PR`, `dataInicial`/`dataFinal` (janela de 7 dias), `codigoModalidadeContratacao` (iterando a tabela), `pagina`/`tamanhoPagina`, paginando até esgotar `totalPaginas` — tratamento de HTTP 204 (corpo vazio, sem resultados) e de HTTP 429 (rate limit, com backoff progressivo de até 5 tentativas) descobertos durante validação manual contra a API real
- [x] 2.4 Implementar `pncp-pr.mapper.ts`: mapear cada registro (`RecuperarCompraPublicacaoDTO`) para `RawOpportunity`/`RawOpportunityDetails` — `externalId = numeroControlePNCP`, `title = objetoCompra`, `issuingOrganization` a partir de `orgaoEntidade`, `officialUrl` a partir de `linkProcessoEletronico`/`linkSistemaOrigem` (com fallback para o endpoint real de detalhe da API, nunca uma URL inventada); descarta registros com `orgaoEntidade.esferaId !== "E"` (decisão confirmada com o usuário: manter escopo apenas estadual, não capturar os 399 municípios)
- [x] 2.5 Implementar `pncp-pr.scraper.ts`: `fetchOpportunities()` itera sequencialmente (não em paralelo — concorrência alta causava instabilidade/429 contra a API real) as 19 modalidades e agrega os resultados já filtrados por `esferaId = "E"`; `fetchOpportunityDetails(externalId)` retorna os dados já capturados na mesma execução, sem segunda chamada de API
- [x] 2.6 Garantir que oportunidades sem anexos disponíveis via API não sejam tratadas como falha (lista de anexos vazia é um resultado válido — confirmado nos 524 registros reais capturados, nenhum com anexo, todos persistidos com sucesso)
- [x] 2.7 Registrar o scraper no array `NOTICE_SCRAPERS` de `scrapers.module.ts` e adicionar `pncp-pr` a `DAILY_SCRAPER_KEYS`

## 3. Testes

- [x] 3.1 Capturar fixture HTML real (reduzida) da listagem `/Programas-Abertos` da Fundação Araucária, incluindo um item com data futura ("até DD/MM/AAAA"), um com "Fluxo Contínuo" e um vencido
- [x] 3.2 Escrever testes unitários de `fundacao-araucaria.mapper.ts`: parsing de itens, filtragem de vencidos, derivação de `externalId`, identificação de anexos, extração de órgão responsável (4 testes)
- [x] 3.3 Capturar fixtures JSON reais (reduzidas) de respostas de `/v1/contratacoes/publicacao` filtradas por `uf=PR`, incluindo registro estadual e municipal (para testar o filtro) e uma segunda página
- [x] 3.4 Escrever testes unitários de `pncp-pr.mapper.ts`: filtro `esferaId`, mapeamento de campos, fallback de `officialUrl` quando não há link publicado (3 testes)
- [x] 3.5 Escrever teste de paginação do cliente PNCP (múltiplas páginas agregadas corretamente) e de resposta vazia (HTTP 204) usando respostas simuladas (2 testes)
- [x] 3.6 Garantir que nenhum teste realiza requisição de rede real (mock de `fetchHtml`/`fetchJson` via `jest.mock` em ambas as fontes) — suíte completa do módulo `scrapers`: 22 testes, 7 arquivos, todos passando

## 4. Validação Manual Contra os Sistemas Reais

- [x] 4.1 Executar o scraper da Fundação Araucária manualmente contra `www.fappr.pr.gov.br` real — `COMPLETED`, 16 encontrados, 12 criados (chamadas reais: Acolhida a Ucranianos, Top Managers Fase II, HUB X – Deep Tech Paraná, etc.); itens vencidos (ex.: PA Argentina/GMC Conicet) corretamente excluídos
- [x] 4.2 Executar o scraper PNCP/PR manualmente contra a API real, filtrado por `uf=PR` — `COMPLETED`, 524 licitações estaduais reais capturadas (IAPAR-EMATER, UNIOESTE, FUNDEPAR, UNESPAR, Instituto Água e Terra, Paraná Esporte, FUNEAS, universidades estaduais etc.), nenhum município presente — filtro `esferaId` validado contra dados reais
- [x] 4.3 Confirmar deduplicação: reexecutar ambos os scrapers — Fundação Araucária: segunda execução `COMPLETED` com 0 criados/0 atualizados; total de `opportunities` (539) e `documents` (162) inalterado
- [x] 4.4 Confirmar que o `ScraperExecution` de ambas as fontes reflete corretamente contagens e status reais (validado nas execuções acima)

## 5. Validação Final

- [x] 5.1 Validar que os jobs agendados diários das duas novas fontes são registrados — confirmado via chaves `bull:scrapers:repeat:daily-fundacao-araucaria` e `bull:scrapers:repeat:daily-pncp-pr` criadas automaticamente no Redis
- [x] 5.2 Atualizar o README mencionando as 3 fontes agora ativas e o desvio de escopo do Compras Paraná (GMS → PNCP/PR), com justificativa (captcha inviável, Portal da Transparência bloqueado por `robots.txt`)
