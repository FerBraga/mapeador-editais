## Why

A change `primeiro-scraper` entregou o `scraper-framework` e validou a esteira completa com uma única fonte (Cultura SEEC-PR). O planejamento do produto (Etapa 4) prevê expandir a cobertura para as demais fontes originalmente previstas: Fundação Araucária e Compras Paraná. Um levantamento técnico (feito durante a change anterior e complementado agora) mostrou que nenhuma das duas pode ser capturada da forma ingenuamente prevista no planejamento original — isso precisa ser corrigido antes de implementar, não depois.

**Fundação Araucária** (`fappr.pr.gov.br/Programas-Abertos`) é viável por scraping: HTML estático, sem login, sem captcha, com PDFs/DOCX linkados diretamente na listagem (sem páginas de detalhe próprias por chamada).

**Compras Paraná**, por outro lado, não é viável por scraping direto: o sistema oficial (GMS, `gms.pr.gov.br`) exige resolução de captcha em qualquer consulta, e a alternativa institucional (Portal da Transparência do Paraná, `/pte/compras/licitacoes`) é uma aplicação JSF/AJAX complexa e, mais importante, tem `/pte` explicitamente bloqueado no `robots.txt` do domínio para qualquer agente automatizado não listado nominalmente — contornar isso violaria a diretriz de segurança do próprio planejamento (seção 14: "respeitar políticas de acesso de terceiros"). A alternativa correta, e preferível por si só (seção 6.1 do planejamento: "sempre preferir APIs públicas"), é consumir a **API pública de consulta do PNCP** (Portal Nacional de Contratações Públicas, `pncp.gov.br/api/consulta`), filtrando por `uf=PR`: API REST pública, sem autenticação, sem captcha, JSON estruturado, paginada e documentada via OpenAPI.

## What Changes

- Implementar o scraper da fonte **Fundação Araucária** (`fundacao-araucaria`), reutilizando o `scraper-framework` já existente: descoberta de chamadas públicas abertas a partir da listagem única em `/Programas-Abertos`, com filtragem de itens já vencidos pela data de inscrição informada no texto, e identificação de anexos (PDF/DOCX) linkados inline (sem página de detalhe própria — `fetchOpportunityDetails` retorna os dados já obtidos durante a listagem).
- Implementar um cliente de integração com a **API pública de consulta do PNCP** (`pncp-pr-source`), consumindo o endpoint `GET /v1/contratacoes/publicacao` filtrado por `uf=PR`, com paginação (`pagina`, `tamanhoPagina`) e iteração sobre os códigos de modalidade de contratação conhecidos (campo obrigatório na API), mapeando os registros retornados para o formato `RawOpportunity`/`RawOpportunityDetails` do `scraper-framework`. Esta fonte substitui o scraping do GMS/Compras Paraná previsto originalmente no planejamento — **desvio documentado**: não é mais scraping de HTML, é consumo de API pública, mais alinhado à própria diretriz do planejamento.
- Cadastrar os dois novos registros `Source` (`sourceType = PUBLIC_PROCUREMENT` para Fundação Araucária classificando como fomento, ou `INNOVATION`/`OTHER` conforme a natureza da chamada; `PUBLIC_PROCUREMENT` para a fonte PNCP/PR) e adicioná-los a `DAILY_SCRAPER_KEYS`.
- Registrar os dois novos scrapers no array `NOTICE_SCRAPERS` de `scrapers.module.ts`, sem alterar a interface `NoticeScraper` nem a lógica de orquestração/dedup/lock já existente no `scraper-framework`.
- Criar fixtures e testes unitários para ambas as fontes, seguindo o padrão já estabelecido em `cultura-pr/`.
- Validar manualmente ambas as fontes contra os sistemas reais (site da Fundação Araucária e API do PNCP).

Fora de escopo nesta change: download/extração de texto dos PDFs capturados, análise por IA, geocodificação, e qualquer tratamento especial para a eventual futura disponibilização de uma API oficial do GMS (se o estado do Paraná vier a publicá-la sem captcha, isso será reavaliado em change própria).

## Capabilities

### New Capabilities
- `fundacao-araucaria-scraper`: implementação do scraper da fonte Fundação Araucária (`fappr.pr.gov.br`), incluindo filtragem de chamadas vencidas e extração de anexos inline.
- `pncp-pr-source`: integração com a API pública de consulta do PNCP, filtrada para o estado do Paraná, como fonte de dados de licitações/compras públicas — substituindo o scraping (inviável) do sistema GMS do Compras Paraná.

### Modified Capabilities
<!-- Nenhuma: scraper-framework (capability já existente, arquivada em openspec/specs/) não terá seus requisitos alterados — as novas fontes apenas implementam a interface NoticeScraper já definida. -->

## Impact

- **Novo código**: `backend/src/modules/scrapers/fundacao-araucaria/` (scraper + mapper + http client) e `backend/src/modules/scrapers/pncp-pr/` (scraper + client de API, sem necessidade de parsing HTML/Cheerio).
- **Dependências novas**: nenhuma — PNCP é consumido via `fetch` nativo (JSON), Fundação Araucária via Cheerio (já usado por `cultura-pr`).
- **Banco de dados**: popula `Source` (2 novos registros) e, nas próximas execuções, `Opportunity`/`Document`/`ScraperExecution` para as duas fontes; não altera o schema.
- **Sistemas externos**: requisições HTTP reais a `fappr.pr.gov.br` (scraping, com rate limiting próprio) e a `pncp.gov.br/api/consulta` (API pública, sem necessidade de rate limiting agressivo, mas ainda assim educado).
- **Desvio de escopo em relação ao planejamento original**: a fonte "Compras Paraná" deixa de ser scraping do GMS e passa a ser consumo da API do PNCP filtrada por PR — mesma necessidade de negócio (licitações/compras públicas do estado), fonte de dados tecnicamente viável e preferível.
