## 1. Schema e Migration

- [x] 1.1 Adicionar `CREATE EXTENSION IF NOT EXISTS unaccent;` e `CREATE EXTENSION IF NOT EXISTS pg_trgm;` à migration (raw SQL, mesmo padrão já usado para `postgis`)
- [x] 1.2 Adicionar model `OpportunityMunicipality` (opportunityId, municipalityId, createdAt; `@@unique([opportunityId, municipalityId])`; índices nos dois lados; `onDelete: Cascade` nos dois lados) ao `schema.prisma`
- [x] 1.3 Adicionar campo `Opportunity.coversEntireState Boolean @default(false)` ao `schema.prisma`
- [x] 1.4 Gerar e aplicar a migration (`prisma migrate dev`)

## 2. Matching e Normalização

- [x] 2.1 Criar módulo `backend/src/modules/geolocation/` com `geolocation.constants.ts` (nome da fila, nome do job, limiar de similaridade configurável)
- [x] 2.2 Implementar normalização de texto (lowercase, remoção de acentos, remoção de prefixos comuns como "município de "/"cidade de ")
- [x] 2.3 Implementar lista curada de frases normalizadas de abrangência estadual e função de detecção
- [x] 2.4 Implementar `MunicipalityMatcherService` com busca exata (pós-normalização) e fallback de similaridade via `pg_trgm` (`$queryRaw`), aplicando o limiar mínimo de confiança
- [x] 2.5 Garantir que entradas sem correspondência confiável retornem "não resolvido" (nunca forçar um match abaixo do limiar)

## 3. Serviço de Resolução e Persistência

- [x] 3.1 Implementar `GeolocationService.resolveOpportunity(opportunityId)`: busca todas as `AIAnalysis` `COMPLETED` da oportunidade, une/deduplica `municipiosContemplados`, resolve cada nome via o matcher
- [x] 3.2 Persistir o resultado substituindo completamente o conjunto de `OpportunityMunicipality` da oportunidade (delete + recreate) e atualizando `Opportunity.coversEntireState`
- [x] 3.3 Garantir idempotência: executar a resolução múltiplas vezes com os mesmos dados não duplica vínculos
- [x] 3.4 Registrar (log) nomes não resolvidos, sem interromper a resolução dos demais

## 4. Fila, Worker, Endpoint Manual e Disparo Automático

- [x] 4.1 Criar fila BullMQ dedicada `geolocation` e `GeolocationQueueProcessor`
- [x] 4.2 Criar `geolocation-processor.module.ts` e `geolocation-worker.module.ts`, atualizar `backend/src/workers/geolocation.worker.ts` para usar o module (mesmo padrão de `ai-analysis`)
- [x] 4.3 Implementar `GeolocationService.enqueueResolution(opportunityId)` e endpoint manual `POST /geolocation/opportunities/:opportunityId`
- [x] 4.4 `AiAnalysisModule` importa `GeolocationModule`; `AiAnalysisService` injeta `GeolocationService` e chama `enqueueResolution` após persistir uma `AIAnalysis` com `status = COMPLETED`

## 5. Testes

- [x] 5.1 Testes unitários de normalização de texto (remoção de acentos, prefixos, lowercase)
- [x] 5.2 Testes unitários de detecção de abrangência estadual (casos positivos e negativos, incluindo o caso "Paraná" vs. "Alto Paraná")
- [x] 5.3 Testes unitários do `GeolocationService.resolveOpportunity` com matcher mockado (união de múltiplas análises, substituição completa, idempotência, entradas não resolvidas)
- [x] 5.4 Teste unitário confirmando que o disparo automático ocorre apenas quando `AIAnalysis.status = COMPLETED`, não em `FAILED`

## 6. Validação Real

- [x] 6.1 Rodar a resolução geográfica (via reprocessamento manual) contra as `AIAnalysis` reais já persistidas na change anterior (CP 10/2022 e Mobilidade Cultural)
- [x] 6.2 Confirmar que o edital estadual (Mobilidade Cultural) é marcado com `coversEntireState = true`
- [x] 6.3 Confirmar que municípios mencionados nos editais reais são corretamente vinculados via `OpportunityMunicipality`
- [x] 6.4 Confirmar que o disparo automático funciona: rodar uma nova análise de IA real e verificar que a resolução geográfica é enfileirada e executada sem intervenção manual
- [x] 6.5 Documentar os resultados observados (quais nomes foram resolvidos, quais ficaram não resolvidos, e por quê)

### Resultados da validação real (2026-11-02)

API + worker `ai-analysis` + worker `geolocation` executados localmente contra o Postgres/Redis reais via Docker Compose.

1. **"Universidades Amig@s: Ucrânia" (CP 10/2022)** — `municipiosContemplados = ["Paraná"]` → corretamente detectado como abrangência estadual (`coversEntireState = true`), sem tentar casar "Paraná" contra um município específico.
2. **"Mobilidade Cultural - 2ª edição"** — possui 2 `AIAnalysis` (variância real do LLM entre chamadas): uma extraiu `["Curitiba", "Demais municípios do Estado do Paraná"]`, a outra `[]`. A união das duas foi usada na resolução (conforme design). "Curitiba" resolveu por correspondência exata e foi vinculado via `OpportunityMunicipality`. **Achado real**: "Demais municípios do Estado do Paraná" não batia na lista curada original de frases estaduais — ficou "não resolvido" (comportamento seguro, exatamente como desenhado para esse caso). Como essa frase é uma variação plausível e real de abrangência estadual, a detecção foi expandida com um padrão regex (`(demais|outros|todos) municipios do (estado|parana)`) para cobrir essa e variações semelhantes, com teste unitário dedicado. Após a correção, reprocessado com sucesso: `coversEntireState = true`, mantendo o vínculo específico com Curitiba.
3. **Disparo automático (sem endpoint manual)**: nova análise de IA real disparada para o documento "CP 09/2022: Edital" (`municipiosContemplados = ["Paraná"]`); a resolução geográfica foi enfileirada e processada automaticamente pelo worker dedicado, resultando em `coversEntireState = true` sem qualquer chamada ao endpoint `/geolocation/opportunities/:id`.

**Nota operacional observada durante a validação** (não é um bug de código, mas documentada para referência futura): processos de worker iniciados via `node dist/...` não recarregam automaticamente após um rebuild (`nest build`); é preciso reiniciar os processos após recompilar para que peguem o código novo. Isso gerou um falso negativo inicial na validação (worker antigo sem a integração mais recente), corrigido ao reiniciar os processos com o build atual.
