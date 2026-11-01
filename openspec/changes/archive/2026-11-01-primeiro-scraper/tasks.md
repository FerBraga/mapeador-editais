## 1. Interface e Contratos de Scraper

- [x] 1.1 Criar `scrapers/contracts/notice-scraper.interface.ts` com a interface `NoticeScraper` (`sourceKey`, `fetchOpportunities()`, `fetchOpportunityDetails(externalId)`)
- [x] 1.2 Definir tipos `RawOpportunity` e `RawOpportunityDetails` (dados brutos capturados antes da normalização)
- [x] 1.3 Definir tipo de normalização que mapeia `RawOpportunityDetails` para o formato aceito pela camada de persistência (`Opportunity` + lista de anexos candidatos)

## 2. Infraestrutura Compartilhada de Scraping (`scraper-framework`)

- [x] 2.1 Implementar serviço de normalização de dados capturados (`ScraperNormalizationService`, hash de conteúdo via sha256)
- [x] 2.2 Implementar lógica de deduplicação por (`sourceId`, `externalId`) e por `contentHash`
- [x] 2.3 Implementar criação/atualização de `ScraperExecution` (início, fim, contagens, erro) para qualquer execução de scraper
- [x] 2.4 Implementar lock de execução única por fonte (impedir `RUNNING` concorrente para a mesma `sourceId`) — validado: segunda execução rejeitada com `ConflictException` enquanto a primeira está `RUNNING`
- [x] 2.5 Implementar criação de registros `Document` com `extractionStatus = PENDING` a partir dos anexos identificados, sem download do conteúdo
- [x] 2.6 Implementar orquestrador de execução de scraper (`ScrapersService.runSource`, dado um `NoticeScraper`, executa o fluxo completo: listar → detalhar → normalizar → deduplicar → persistir → registrar execução)
- [x] 2.7 Registrar job repetível BullMQ (diário) por fonte, reaproveitando `shared/queue` — via `queue.upsertJobScheduler` (BullMQ 6 substituiu a opção `repeat` de `add()` por essa API); validado que a chave `bull:scrapers:repeat:daily-cultura-pr` é criada no Redis
- [x] 2.8 Expor endpoint/mecanismo de disparo manual de execução — `POST /api/v1/scrapers/:scraperKey/run` (não `/admin/sources/:id/scrape`, pois o módulo `sources`/autenticação admin ainda não existem nesta etapa). **Decisão de design não prevista originalmente**: o endpoint apenas enfileira o job (retorna `202` com `jobId`) e retorna imediatamente; o lock e a execução real só são verificados dentro do worker (`ScraperQueueProcessor`), para a API nunca bloquear esperando o scraping — alinhado à seção 3 do planejamento ("API não deve aguardar a execução de scraping")

## 3. Scraper da Fonte Cultura SEEC-PR

- [x] 3.1 Criar registro `Source` (via seed) para "Cultura SEEC-PR" com `baseUrl = https://www.cultura.pr.gov.br`, `sourceType = CULTURE`, `scraperKey = cultura-pr`
- [x] 3.2 Implementar `fetchOpportunities()`: busca a home e extrai, do submenu "Editais Abertos", a lista de URLs/títulos de editais abertos
- [x] 3.3 Implementar `fetchOpportunityDetails(externalId)`: busca `/Pagina/<externalId>` e extrai título (`h1.page-title`), URL oficial (atributo `about` do `article#content`) e órgão emissor (sufixo do `<title>`)
- [x] 3.4 Implementar identificação de links para PDF/DOCX na página de detalhe como anexos candidatos
- [x] 3.5 Implementar derivação de `externalId` a partir do slug da URL, **preservando o case original** (não lowercase) — correção em relação ao plano inicial: o path do site é case-sensitive (ex.: "MOVCEU" maiúsculo) e o `externalId` é reutilizado literalmente para buscar a página de detalhe, então normalizar para lowercase quebraria a busca. A deduplicação/unicidade continua garantida pela constraint `(sourceId, externalId)` no schema
- [x] 3.6 Implementar `cultura-pr.mapper.ts`: funções puras de parsing (Cheerio) separadas do `cultura-pr.scraper.ts` (que só orquestra fetch + mapper), facilitando testes
- [x] 3.7 Implementar intervalo mínimo entre requisições (1.5s) e `User-Agent` identificável nas chamadas HTTP ao portal (`cultura-pr-http-client.ts`)
- [x] 3.8 Tratar falha de extração de um item individual sem abortar a execução inteira — validado com teste automatizado e manualmente (resultado final `PARTIALLY_COMPLETED` quando aplicável)

## 4. Testes

- [x] 4.1 Capturar fixtures HTML (reduzidas, baseadas na estrutura real observada em `www.cultura.pr.gov.br`) em `scrapers/cultura-pr/__fixtures__/`: home com/sem o submenu "Editais Abertos", página de detalhe real (Edital MOVCEU Paraná) e página com estrutura inesperada
- [x] 4.2 Escrever testes unitários de `fetchOpportunities()` / `parseOpenNoticesFromHome()` usando a fixture da home/menu
- [x] 4.3 Escrever testes unitários de `fetchOpportunityDetails()` / `parseOpportunityDetail()` usando a fixture de página de detalhe
- [x] 4.4 Escrever teste de deduplicação (segunda execução sobre o mesmo conteúdo não cria duplicata, atualiza apenas `lastScrapedAt`)
- [x] 4.5 Escrever teste de atualização de conteúdo alterado (mudança de `contentHash` dispara atualização dos campos)
- [x] 4.6 Escrever teste de execução com falha parcial (um item com HTML inesperado não impede o processamento dos demais; status final `PARTIALLY_COMPLETED`)
- [x] 4.7 Garantir que a suíte de testes não realiza nenhuma requisição de rede real (mock de `fetchHtml` via `jest.mock`; testes do mapper são puros, sem rede) — suíte completa: 13 testes, 4 arquivos, todos passando

## 5. Validação Manual Contra o Site Real

- [x] 5.1 Executar o scraper manualmente em ambiente de desenvolvimento contra `www.cultura.pr.gov.br` real (via `POST /api/v1/scrapers/cultura-pr/run` + `worker:scraper` rodando)
- [x] 5.2 Confirmar que os editais abertos no momento são persistidos corretamente em `Opportunity`, com `rawData` preenchido — 3 editais reais capturados (Edital MOVCEU Paraná, Edital de Pareceristas, Mobilidade Cultural 2ª edição)
- [x] 5.3 Confirmar que os anexos identificados geram registros `Document` com `status = PENDING` e URL de origem correta — 92 anexos reais (PDFs/DOCX) persistidos corretamente
- [x] 5.4 Reexecutar o scraper imediatamente após e confirmar que nenhuma duplicata é criada — confirmado: segunda execução `COMPLETED` com `itemsCreated=0`, `itemsUpdated=0`; contagem de `opportunities`/`documents` inalterada
- [x] 5.5 Confirmar que o `ScraperExecution` da execução real reflete corretamente contagens e status — ambas as execuções `COMPLETED`, com `itemsFound`/`itemsCreated` corretos

## 6. Validação Final

- [x] 6.1 Validar que o job agendado diário é registrado sem intervenção manual — confirmado via chave `bull:scrapers:repeat:daily-cultura-pr` criada automaticamente no Redis ao iniciar a API/worker (execução real do disparo às 03:00 não testada em tempo real, dado o horizonte da validação)
- [x] 6.2 Validar que uma segunda execução manual enquanto a primeira ainda está `RUNNING` é bloqueada pelo lock de fonte — validado inserindo uma execução `RUNNING` real no banco e confirmando que o job subsequente falha com `ConflictException` (visível em `bull:scrapers:failed`)
- [x] 6.3 Documentar no README como adicionar uma nova fonte reutilizando o `scraper-framework` — seção "Adicionando uma nova fonte de scraping" adicionada
