## 1. Interface e Contratos de Scraper

- [ ] 1.1 Criar `scrapers/contracts/notice-scraper.interface.ts` com a interface `NoticeScraper` (`sourceKey`, `fetchOpportunities()`, `fetchOpportunityDetails(externalId)`)
- [ ] 1.2 Definir tipos `RawOpportunity` e `RawOpportunityDetails` (dados brutos capturados antes da normalização)
- [ ] 1.3 Definir tipo de normalização que mapeia `RawOpportunityDetails` para o formato aceito pela camada de persistência (`Opportunity` + lista de anexos candidatos)

## 2. Infraestrutura Compartilhada de Scraping (`scraper-framework`)

- [ ] 2.1 Implementar serviço de normalização de dados capturados
- [ ] 2.2 Implementar lógica de deduplicação por (`sourceId`, `externalId`) e por `contentHash`
- [ ] 2.3 Implementar criação/atualização de `ScraperExecution` (início, fim, contagens, erro) para qualquer execução de scraper
- [ ] 2.4 Implementar lock de execução única por fonte (impedir `RUNNING` concorrente para a mesma `sourceId`)
- [ ] 2.5 Implementar criação de registros `Document` com `extractionStatus = PENDING` a partir dos anexos identificados, sem download do conteúdo
- [ ] 2.6 Implementar orquestrador de execução de scraper (dado um `NoticeScraper`, executa o fluxo completo: listar → detalhar → normalizar → deduplicar → persistir → registrar execução)
- [ ] 2.7 Registrar job repetível BullMQ (diário) por fonte, reaproveitando `shared/queue`
- [ ] 2.8 Expor endpoint/mecanismo de disparo manual de execução (ex.: `POST /api/v1/admin/sources/:id/scrape`, respeitando o lock de execução única)

## 3. Scraper da Fonte Cultura SEEC-PR

- [ ] 3.1 Criar registro `Source` (via seed/migration de dados) para "Cultura SEEC-PR" com `baseUrl = https://www.cultura.pr.gov.br`, `sourceType = CULTURE`, `scraperKey` correspondente
- [ ] 3.2 Implementar `fetchOpportunities()`: buscar uma página do site e extrair, do submenu "Editais Abertos", a lista de URLs/títulos de editais abertos
- [ ] 3.3 Implementar `fetchOpportunityDetails(externalId)`: buscar a página `/Pagina/<slug>` e extrair título, URL oficial e demais campos disponíveis sem IA
- [ ] 3.4 Implementar identificação de links para PDF/DOCX na página de detalhe como anexos candidatos
- [ ] 3.5 Implementar derivação de `externalId` a partir do slug da URL, com normalização (lowercase, sem parâmetros de tracking)
- [ ] 3.6 Implementar `cultura-pr.mapper.ts`: mapear os dados extraídos para o formato normalizado esperado pelo `scraper-framework`
- [ ] 3.7 Implementar intervalo mínimo entre requisições e `User-Agent` identificável nas chamadas HTTP ao portal
- [ ] 3.8 Tratar falha de extração de um item individual sem abortar a execução inteira (log + contabilização, resultado final `PARTIALLY_COMPLETED` quando aplicável)

## 4. Testes

- [ ] 4.1 Capturar fixtures HTML reais (home com o submenu "Editais Abertos" e ao menos uma página de detalhe de edital) e salvar em `scrapers/cultura-pr/__fixtures__/`
- [ ] 4.2 Escrever testes unitários de `fetchOpportunities()` usando a fixture da home/menu
- [ ] 4.3 Escrever testes unitários de `fetchOpportunityDetails()` usando a fixture de página de detalhe
- [ ] 4.4 Escrever teste de deduplicação (segunda execução sobre o mesmo conteúdo não cria duplicata, atualiza `lastScrapedAt`)
- [ ] 4.5 Escrever teste de atualização de conteúdo alterado (mudança de `contentHash` dispara atualização dos campos)
- [ ] 4.6 Escrever teste de execução com falha parcial (um item com HTML inesperado não impede o processamento dos demais)
- [ ] 4.7 Garantir que a suíte de testes não realiza nenhuma requisição de rede real (mock/stub do client HTTP)

## 5. Validação Manual Contra o Site Real

- [ ] 5.1 Executar o scraper manualmente em ambiente de desenvolvimento contra `www.cultura.pr.gov.br` real
- [ ] 5.2 Confirmar que os editais abertos no momento são persistidos corretamente em `Opportunity`, com `rawData` preenchido
- [ ] 5.3 Confirmar que os anexos identificados geram registros `Document` com `status = PENDING` e URL de origem correta
- [ ] 5.4 Reexecutar o scraper imediatamente após e confirmar que nenhuma duplicata é criada
- [ ] 5.5 Confirmar que o `ScraperExecution` da execução real reflete corretamente contagens e status

## 6. Validação Final

- [ ] 6.1 Validar que o job agendado diário dispara a execução sem intervenção manual (testável reduzindo temporariamente o intervalo em ambiente de dev)
- [ ] 6.2 Validar que uma segunda execução manual enquanto a primeira ainda está `RUNNING` é bloqueada pelo lock de fonte
- [ ] 6.3 Documentar no README (ou doc técnico do módulo `scrapers`) como adicionar uma nova fonte reutilizando o `scraper-framework`, preparando o terreno para a change de expansão de scrapers
