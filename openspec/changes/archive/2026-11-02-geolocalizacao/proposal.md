## Why

A change `integracao-ia` já extrai `municipiosContemplados` como texto bruto (nomes de município como aparecem no edital) dentro de `AIAnalysis.structuredResult`, mas não resolve esses nomes contra municípios reais. Sem essa resolução, o mapa (próximas changes de API/frontend) não tem como filtrar ou exibir editais por localização geográfica — o objetivo central do produto ("Mapa Inteligente de Editais"). Esta change (Etapa 9 do planejamento) fecha essa lacuna, casando o texto extraído pela IA contra o gazetteer real de 399 municípios do Paraná já seedado desde `foundation-setup`.

## What Changes

- Adiciona tabela de associação N:N `OpportunityMunicipality` (uma oportunidade pode cobrir zero, um ou vários municípios), substituindo a necessidade de um único `municipalityId` para representar geografia de editais multi-município.
- Adiciona campo `Opportunity.coversEntireState Boolean` para representar editais estaduais sem precisar linkar as 399 linhas de município.
- Implementa resolução determinística de nomes de município via normalização (lowercase + remoção de acentos) e correspondência exata, com fallback para similaridade de trigrama (`pg_trgm`, limiar 0.65) contra a tabela `Municipality` — nunca pedindo à IA para "decidir" o ID do município.
- Detecção de menções estaduais (ex.: "Paraná", "Estado do Paraná") checada **antes** do casamento de município individual, usando uma lista curada de frases normalizadas — necessário porque testes reais mostraram que a palavra isolada "Paraná" tem 0.58 de similaridade contra o município real "Alto Paraná" (falso positivo perigoso sem essa checagem prévia).
- Entradas sem correspondência confiável ficam não resolvidas (sem município vinculado) e são registradas como aviso — nunca força um match de baixa confiança.
- Disparo **automático**: toda vez que uma `AIAnalysis` é persistida com `status = COMPLETED`, enfileira a resolução geográfica da `Opportunity` correspondente (sem custo de API paga envolvido, diferente da change anterior). Também expõe um endpoint manual para reprocessar a resolução de uma oportunidade específica.
- Cada resolução busca todas as `AIAnalysis` `COMPLETED` da oportunidade (não só a que disparou o job), une os `municipiosContemplados` de todas elas, e substitui completamente o conjunto de `OpportunityMunicipality` daquela oportunidade com o resultado fresco (índice derivado recalculável, diferente do histórico imutável de `AIAnalysis`).
- Novo módulo `backend/src/modules/geolocation/` (até então stub vazio da fundação do projeto), com fila/worker BullMQ dedicados, seguindo o mesmo padrão arquitetural de `ai-analysis`/`documents`/`scrapers`.
- Migration Prisma aditiva: extensões `unaccent` e `pg_trgm`, novo model `OpportunityMunicipality`, novo campo `Opportunity.coversEntireState`.

## Capabilities

### New Capabilities
- `opportunity-geolocation`: resolução determinística de municípios contemplados por um edital a partir do texto extraído pela IA, casando contra o gazetteer real de municípios do Paraná, com detecção de abrangência estadual, disparo automático pós-análise de IA, e persistência via tabela de associação N:N.

### Modified Capabilities
- `database-schema`: o requisito "Schema Completo das Entidades do Domínio" passa a incluir a nova entidade `OpportunityMunicipality` na lista de entidades definidas via Prisma.

## Impact

- Novo módulo `backend/src/modules/geolocation/` (service, matcher, constants, processor, module).
- Nova fila/worker BullMQ dedicados (`geolocation`), preenchendo o worker já scaffolded em `backend/src/workers/geolocation.worker.ts`.
- `AiAnalysisModule` passa a importar `GeolocationModule` e `AiAnalysisService` injeta `GeolocationService` para enfileirar a resolução após persistir uma análise `COMPLETED` (mesmo padrão de `ScrapersService` → `DocumentsService.enqueueNewDocument`).
- Migration Prisma aditiva (extensões + novo model + novo campo em `Opportunity`).
- Nenhuma dependência nova de pacote — matching via SQL nativo (`$queryRaw`/`$executeRaw`), mesmo padrão já usado para PostGIS em `prisma/seed.ts`.
