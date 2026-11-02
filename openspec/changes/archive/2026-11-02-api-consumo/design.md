## Context

539 `Opportunity` reais já estão no banco, com `category`/`source` sempre presentes, `municipalityLinks`/`coversEntireState` preenchidos quando a resolução geográfica encontra algo, `requiredDocuments` e `aiAnalyses` (histórico, podendo incluir registros `FAILED`) quando há análise de IA concluída. **Nenhuma `Opportunity` tem `status` diferente de `UNKNOWN`** — confirmado via consulta real ao banco antes de escrever este design. `ZodValidationPipe` existe desde a fundação do projeto mas nunca foi usado por um endpoint real.

## Goals / Non-Goals

**Goals:**
- Expor listagem/busca/filtro de oportunidades com paginação, incluindo um filtro "aberto" que funcione com os dados reais de hoje (não depende só do campo `status`, que está sempre `UNKNOWN`).
- Expor detalhe de oportunidade com todos os dados já enriquecidos pelas changes anteriores (município, documentos exigidos, resumo de IA).
- Expor listagens simples de categorias, fontes e municípios para popular filtros e o mapa.
- Validar query params com `ZodValidationPipe`, dando o primeiro uso real a essa peça já existente.

**Non-Goals:**
- Autenticação, usuários, favoritos, alertas/notificações — módulos stub correspondentes ficam intocados (decisão explícita do usuário nesta sessão).
- Calcular e persistir um `status` "oficial" (`OPEN`/`CLOSED`/etc.) a partir das datas — o filtro `onlyOpen` desta change é só uma computação em tempo de leitura (na query), não escreve nada no banco. Uma iteração futura pode construir essa lógica de negócio formal.
- Merge/deduplicação entre múltiplas `AIAnalysis` de uma mesma oportunidade — o detalhe mostra a mais recente `COMPLETED`, sem tentar reconciliar divergências entre análises.
- Full-text search avançado (ranking, stemming) — busca livre via `ILIKE` simples é suficiente para o volume atual (centenas, não milhões, de registros).
- Endpoints de escrita (criação/edição manual de oportunidades) — fora do escopo desta API de consumo.

## Decisions

### Filtro `onlyOpen` best-effort, não o campo `status`
Como `status` está `UNKNOWN` em 100% dos dados reais hoje, um filtro que dependesse só dele seria inútil na prática. `onlyOpen=true` SHALL computar na query: `registrationEndAt IS NULL OR registrationEndAt >= now()` E `status NOT IN (CLOSED, CANCELLED, SUSPENDED)` — ou seja, trata `UNKNOWN`/`OPEN`/`UPCOMING` como "potencialmente aberto" e só exclui o que já tem um status explicitamente terminal. O filtro `status` literal continua disponível separadamente, para quando essa informação existir no futuro.

### Filtro de município considera abrangência estadual
`municipalityId` SHALL casar oportunidades vinculadas a esse município via `OpportunityMunicipality` **OU** com `coversEntireState = true` — um edital estadual é relevante para a busca de qualquer município, mesmo sem vínculo direto na tabela de associação.

### Faixa de valores exclui o que não tem dado quando o filtro é aplicado
`fundingMin`/`fundingMax` como filtros SHALL usar sobreposição de faixa (`fundingMax >= filtro.fundingMin`, `fundingMin <= filtro.fundingMax`). Como esses campos são nulos em muitas oportunidades, aplicar um desses filtros naturalmente exclui registros sem dado — comportamento aceito como correto (não forçar inclusão de oportunidades cuja faixa de valor é desconhecida quando o usuário pede um valor específico).

### Detalhe mostra a análise de IA mais recente concluída, sem merge
`GET /opportunities/:id` SHALL retornar a `AIAnalysis` com `status = COMPLETED` mais recente (por `createdAt`) para os campos de resumo/resultado estruturado, ignorando análises `FAILED` e sem tentar reconciliar divergências entre múltiplas análises `COMPLETED` históricas. Todos os `RequiredDocument` da oportunidade são retornados sem deduplicação (consistente com como já são persistidos).

### Endpoint de municípios como plumbing mínima do mapa
`GET /municipalities` SHALL listar os 399 municípios já seedados com coordenadas e uma contagem de oportunidades vinculadas (via `OpportunityMunicipality`), permitindo ao frontend desenhar o mapa base e os indicadores de volume por município sem round-trips adicionais.

### Validação de query params via `ZodValidationPipe`
Cada endpoint de listagem SHALL definir um schema Zod para seus query params (coerção de tipos, limites de paginação, enums), aplicado via `ZodValidationPipe` já existente — primeiro consumidor real dessa peça de infraestrutura.

## Risks / Trade-offs

- **[Risco] `onlyOpen` pode incluir falsos positivos (oportunidades na prática já encerradas mas sem `registrationEndAt` capturado)** → Aceito como limitação conhecida; o dado de origem (scrapers) é quem precisaria capturar a data para eliminar esse caso, fora do escopo desta change.
- **[Trade-off] Busca livre via `ILIKE` sem ranking** → aceitável para o volume atual; revisar se o catálogo crescer para dezenas de milhares de registros.
- **[Trade-off] Detalhe não mescla múltiplas análises de IA** → simplicidade deliberada; documentado como Non-Goal.

## Migration Plan

Nenhuma migration necessária — todos os endpoints são somente leitura sobre tabelas já existentes.
