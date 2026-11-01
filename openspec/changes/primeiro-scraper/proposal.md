## Why

Com a fundação do projeto pronta (change `foundation-setup`), o sistema ainda não captura nenhum edital real. A seção 20 do planejamento do produto define que a primeira entrega demonstrável deve ser "um edital real capturado automaticamente de um portal, persistido no banco". Esta change constrói a esteira completa de captura para a primeira fonte, validando o fluxo scraper → normalização → deduplicação → persistência → agendamento antes de replicar o padrão para as demais fontes (Fundação Araucária e Compras Paraná, em change futura).

Um levantamento técnico dos três portais candidatos (seção 6.1 do planejamento) mostrou que **Compras Paraná** exige captcha obrigatório em qualquer consulta (sistema GMS), tornando-o inviável como primeira fonte. **SIC.Cultura/SEEC-PR** — cujo subdomínio original (`sic.cultura.pr.gov.br`) não resolve mais via DNS — tem seus editais hoje publicados em `www.cultura.pr.gov.br`: HTML estático, sem autenticação, com URL própria por edital e anexos em PDF publicamente acessíveis. Esta é a fonte escolhida para o primeiro scraper por ser a de menor fricção técnica e maior aderência à interface `NoticeScraper` prevista no planejamento (seção 6.2).

## What Changes

- Criar a interface padronizada `NoticeScraper` (contrato comum a todos os scrapers) e a infraestrutura compartilhada de scraping: normalização de dados capturados, deduplicação por (`sourceId`, `externalId`) e por hash de conteúdo, registro de execuções (`ScraperExecution`), e agendamento via BullMQ (execução diária + execução manual).
- Implementar o scraper da fonte "Cultura SEEC-PR" sobre `www.cultura.pr.gov.br`: descoberta de editais abertos (via parsing do submenu "Editais e Licitações > Editais Abertos", presente em todas as páginas do site), extração dos dados de cada edital a partir de sua página de detalhe (`/Pagina/<slug>`), e identificação dos anexos em PDF linkados.
- Persistir as oportunidades capturadas na tabela `Opportunity` (preenchendo os campos possíveis sem IA: título, órgão emissor, URL oficial, `externalId`, `rawData`; campos que dependem de IA/geolocalização — resumo, valores, município — ficam `null` nesta change, preenchidos em changes futuras).
- Registrar cada anexo identificado como `Document` com status `PENDING` (o download e a extração de texto são escopo da change de pipeline de documentos, não desta).
- Criar o `Source` correspondente a "Cultura SEEC-PR" com `baseUrl` atualizado (`https://www.cultura.pr.gov.br`) e `sourceType = CULTURE`.
- Garantir que uma segunda execução do scraper sobre o mesmo conteúdo não crie duplicatas, apenas atualize campos alterados e registre a atualização.
- Criar testes com HTML de exemplo (fixtures) do portal, sem depender de requisições reais ao site durante a suíte de testes automatizados.

Fora de escopo nesta change: scrapers de Fundação Araucária e Compras Paraná (change de expansão futura), download/extração de PDFs, análise por IA, geocodificação, e qualquer endpoint de API para consumir as oportunidades capturadas (a captura fica disponível apenas via banco de dados nesta etapa).

## Capabilities

### New Capabilities
- `scraper-framework`: interface padronizada `NoticeScraper`, normalização, deduplicação, registro de execuções e agendamento via BullMQ, reutilizável por qualquer fonte.
- `cultura-pr-scraper`: implementação do scraper específico da fonte Cultura SEEC-PR (`www.cultura.pr.gov.br`), incluindo descoberta de editais, mapeamento de campos e identificação de anexos.

### Modified Capabilities
<!-- Nenhuma: as capabilities da change `foundation-setup` (project-scaffolding, database-schema, backend-module-structure) ainda não foram arquivadas como specs canônicas; esta change consome sua estrutura, mas não altera requisitos já estabelecidos. -->

## Impact

- **Novo código**: módulo `scrapers` (controller/service para disparo manual e consulta de execuções), subpacote `scrapers/contracts` (interface `NoticeScraper`), subpacote `scrapers/cultura-pr` (scraper + mapper), job/processor BullMQ de agendamento, worker `scraper.worker.ts` com lógica real (substituindo o stub da change anterior).
- **Dependências novas**: Cheerio (parsing HTML estático) — Playwright não é necessário para esta fonte, já que o site é HTML estático server-side.
- **Banco de dados**: popula `Source` (1 registro), `ScraperExecution` (1 por execução), `Opportunity` e `Document` com dados reais capturados; não altera o schema definido em `foundation-setup`.
- **Sistemas externos**: realiza requisições HTTP reais a `www.cultura.pr.gov.br` em produção/homologação; em testes automatizados, usa fixtures HTML locais para não depender do site real.
- **Risco de mudança do portal**: como a fonte não possui API nem contrato estável, mudanças no HTML do site podem quebrar o scraper — mitigado por testes com fixtures e logs detalhados de falha (tratado em design.md).
