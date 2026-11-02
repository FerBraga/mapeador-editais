## 1. Query Schemas e Paginação

- [x] 1.1 Definir schema Zod de paginação comum (`page` default 1, `pageSize` default 20, máximo 100) reutilizável entre endpoints de listagem
- [x] 1.2 Definir schema Zod de query params de `GET /opportunities` (município, categoria, fonte, status, onlyOpen, fundingMin/fundingMax, q, paginação)
- [x] 1.3 Garantir que parâmetros inválidos retornem erro de validação claro via `ZodValidationPipe`, antes de qualquer consulta ao banco

## 2. Listagem e Detalhe de Oportunidades

- [x] 2.1 Implementar `OpportunitiesService.findMany(query)`: monta filtros Prisma (município considerando `coversEntireState`, status literal, `onlyOpen` best-effort, faixa de valores, busca livre `q`), ordena por `registrationEndAt` ascendente, retorna página + metadados
- [x] 2.2 Implementar `OpportunitiesService.findOne(id)`: busca oportunidade com `category`, `source`, `municipalityLinks.municipality`, `requiredDocuments`, e a `AIAnalysis` `COMPLETED` mais recente; lança erro claro se não existir
- [x] 2.3 Implementar `GET /opportunities` e `GET /opportunities/:id` no `OpportunitiesController`
- [x] 2.4 Definir forma de resposta (DTOs/tipos) para listagem (resumo) e detalhe (completo), incluindo município(s) com coordenadas e `coversEntireState`

## 3. Categorias, Fontes e Municípios

- [x] 3.1 Implementar `CategoriesService.findAll()` (ativas por padrão) e `GET /categories`
- [x] 3.2 Implementar `SourcesService.findAll()` (ativas por padrão) e `GET /sources`
- [x] 3.3 Criar módulo `backend/src/modules/municipalities/` com `MunicipalitiesService.findAll()` (id, nome, lat/lon, contagem de oportunidades vinculadas via `OpportunityMunicipality`) e `GET /municipalities`

## 4. Testes

- [x] 4.1 Testes unitários do `OpportunitiesService.findMany` cobrindo cada filtro isoladamente e combinados (município com abrangência estadual, onlyOpen incluindo UNKNOWN mas excluindo status terminal, faixa de valores excluindo nulos, busca livre)
- [x] 4.2 Teste unitário do `OpportunitiesService.findOne` cobrindo: oportunidade com análise concluída mais recente escolhida corretamente entre múltiplas, oportunidade sem nenhuma análise concluída, oportunidade inexistente
- [x] 4.3 Testes unitários de `CategoriesService`/`SourcesService`/`MunicipalitiesService`
- [x] 4.4 Teste de validação de query params inválidos (paginação fora do limite, enum de status inválido)

## 5. Validação Real

- [x] 5.1 Rodar a API localmente e validar `GET /opportunities` com os 539 registros reais: paginação, filtro `onlyOpen`, filtro de município (incluindo um caso estadual confirmado na change anterior), busca livre
- [x] 5.2 Validar `GET /opportunities/:id` contra uma oportunidade real com análise de IA concluída e documentos exigidos, e contra uma sem nenhuma análise
- [x] 5.3 Validar `GET /categories`, `GET /sources` e `GET /municipalities` contra os dados reais, incluindo um município com contagem zero
- [x] 5.4 Documentar os resultados observados

### Resultados da validação real (2026-11-02)

API rodando localmente contra os 539 `Opportunity` reais no Postgres.

- `GET /opportunities?pageSize=3`: retorna dados reais corretamente formatados (município, categoria, fonte).
- `GET /opportunities?onlyOpen=true`: retorna `total=539` com os dados atuais (nenhuma oportunidade tem `registrationEndAt` no passado nem status terminal hoje). Validado que o filtro de fato funciona marcando manualmente 1 oportunidade como `CLOSED` com `registrationEndAt` no passado: total caiu para 538, revertido em seguida.
- `GET /opportunities?q=cultura`: retorna `total=54` de 539, busca livre funcionando em título/descrição/objeto.
- `GET /opportunities?municipalityId=<Curitiba>`: retorna 3 oportunidades — 2 estaduais sem vínculo direto (`coversEntireState=true`, `municipalities=[]`) e 1 vinculada diretamente a Curitiba que também é estadual — confirma que o OR (vínculo direto OU abrangência estadual) funciona corretamente.
- `GET /opportunities/:id` (Mobilidade Cultural): retorna município vinculado com coordenadas, `coversEntireState=true`, 4 `requiredDocuments` (2+2 de duas análises de IA reais distintas, sem deduplicação — confirmado correto ao inspecionar o `structuredResult` de cada análise, não é um bug) e a `AIAnalysis` mais recente concluída.
- `GET /opportunities/:id` com id inexistente: `404` com mensagem clara.
- `GET /opportunities?pageSize=999`: `400` com erro de validação Zod claro, antes de qualquer consulta ao banco.
- `GET /categories`: 5 categorias ativas. `GET /sources`: 3 fontes ativas (Cultura SEEC-PR, Fundação Araucária, PNCP/PR).
- `GET /municipalities`: 399 municípios, Curitiba com `opportunityCount=1` (confirma o dado da change `geolocalizacao`), município sem oportunidades vinculadas aparece com `opportunityCount=0` em vez de ser omitido.
