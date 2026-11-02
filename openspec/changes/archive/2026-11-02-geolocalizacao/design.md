## Context

`AIAnalysis.structuredResult.municipiosContemplados` já contém nomes de município como texto bruto, extraídos pela IA diretamente do texto do edital (change `integracao-ia`), sem qualquer tentativa de resolução contra dados reais. O schema atual tem apenas `Opportunity.municipalityId` (FK única, opcional, não usada por nenhuma lógica de negócio ainda) — insuficiente para representar editais multi-município ou estaduais, muito comuns nos dados reais (ex.: "Mobilidade Cultural" é um edital estadual).

Testes reais via SQL contra os 399 municípios do Paraná já seedados confirmaram a abordagem de matching antes de qualquer código ser escrito:
- `unaccent` + `lower` em ambos os lados resolve variações de acentuação (ex.: "Sao Jose dos Pinhais" → "São José dos Pinhais", similaridade 1.0).
- A palavra isolada "Paraná" (referência estadual) tem 0.58 de similaridade de trigrama contra o município real "Alto Paraná" — um falso positivo perigoso se a detecção de abrangência estadual não for verificada antes do casamento de município individual.
- "Região Metropolitana de Curitiba" tem apenas 0.27 de similaridade contra "Curitiba" — corretamente abaixo de qualquer limiar razoável, confirmando que microrregiões nominadas não devem ser confundidas com município individual.

## Goals / Non-Goals

**Goals:**
- Resolver nomes de município extraídos pela IA contra o gazetteer real de 399 municípios do Paraná, de forma determinística (não pedindo à IA para "decidir" o ID).
- Representar editais estaduais e multi-município corretamente via `coversEntireState` + tabela `OpportunityMunicipality`.
- Nunca vincular uma oportunidade a um município com baixa confiança — preferir deixar não resolvido.
- Disparo automático pós-análise de IA (sem custo de API envolvido) + reprocessamento manual.
- Recalcular/substituir o resultado a cada nova análise, unindo dados de todas as análises `COMPLETED` da oportunidade.

**Non-Goals:**
- Resolver microrregiões/mesorregiões nominadas (ex.: "Região Metropolitana de Curitiba", "Norte Pioneiro") como um conjunto de municípios — fica para uma iteração futura, se necessário.
- Geocodificação de endereços livres (ruas, CEPs) — o escopo é só nomes de município/estado.
- Qualquer alteração ao campo legado `Opportunity.municipalityId` — permanece como está, não usado, fora de escopo.
- Correção automática de erros de digitação além do que a similaridade de trigrama naturalmente tolera.

## Decisions

### Tabela de associação N:N + flag estadual
Novo model `OpportunityMunicipality` (opportunityId, municipalityId, createdAt; `@@unique([opportunityId, municipalityId])`; índices nos dois lados; `onDelete: Cascade` em ambas as relações) substitui a necessidade de um único município por oportunidade. Novo campo `Opportunity.coversEntireState Boolean @default(false)` evita ter que linkar as 399 linhas para editais estaduais. Alternativa considerada: usar só `municipalityId` com `null` significando "não localizado ou múltiplo" — rejeitada por perder completamente a granularidade geográfica de editais multi-município, que é justamente o que o mapa precisa exibir.

### Resolução determinística, não deixada para a IA
O casamento de nomes é feito por lógica própria (normalização + SQL), nunca perguntando ao modelo de IA "qual é o ID deste município". A IA só extrai o texto bruto (já feito em `integracao-ia`); esta change é puramente de matching contra dados estruturados já confiáveis (o gazetteer `Municipality`). Isso evita qualquer risco de a IA "inventar" ou confundir municípios reais.

### Algoritmo de matching (validado com dados reais antes da implementação)
1. Normalizar o texto de entrada: lowercase, remover acentos (`unaccent`), remover prefixos comuns ("município de ", "cidade de ", "cidade do ", "cidade da "), trim.
2. Verificar primeiro se o texto normalizado corresponde a uma menção de abrangência estadual, contra uma lista curada fixa de frases normalizadas (ex.: "parana", "estado do parana", "pr", "todo o estado", "todo o territorio paranaense", "ambito estadual"). Se corresponder, marca `coversEntireState = true` para a oportunidade e não tenta casar como município individual.
3. Caso contrário, tentar correspondência exata (pós-normalização) contra `municipalities.name`.
4. Se não houver correspondência exata, usar `similarity()` do `pg_trgm` contra todos os municípios, pegar o de maior similaridade; aceitar apenas se `similarity >= 0.65`.
5. Se nada atingir o limiar e não for abrangência estadual, a entrada fica não resolvida — registrada como aviso em log, nunca força um match de baixa confiança.

O limiar de 0.65 foi escolhido deliberadamente alto como defesa em profundidade: mesmo que uma variação de frase estadual não prevista na lista fixa escape da checagem do passo 2, ela dificilmente atingiria 0.65 de similaridade contra um município específico (o pior caso observado, "Paraná" vs. "Alto Paraná", ficou em 0.58).

### Origem dos dados: união de todas as análises `COMPLETED`
Ao resolver a geografia de uma `Opportunity`, busca-se TODAS as `AIAnalysis` com `status = COMPLETED` daquela oportunidade (não só a que disparou o job atual), pois diferentes documentos/anexos podem mencionar municípios diferentes. Os `municipiosContemplados` de todas elas são unidos e deduplicados antes da resolução.

### Substituição total, não histórico acumulado
Diferente de `AIAnalysis` (histórico imutável, nunca sobrescrito), o conjunto de `OpportunityMunicipality` de uma oportunidade é **substituído por completo** (delete + recreate) a cada resolução — é um índice derivado para busca/filtro no mapa, recalculável a qualquer momento a partir das análises existentes, não um registro de auditoria.

### Disparo automático (sem o problema de custo da change anterior)
Diferente da análise de IA (que envolve chamadas pagas), a resolução geográfica é só leitura/escrita de banco — sem custo de API. Por isso, o disparo é automático: `AiAnalysisService` injeta `GeolocationService` (via `AiAnalysisModule` importando `GeolocationModule`) e enfileira a resolução após persistir com sucesso uma `AIAnalysis` `COMPLETED`, mesmo padrão já usado por `ScrapersService` → `DocumentsService.enqueueNewDocument`. Um endpoint manual (`POST /geolocation/opportunities/:opportunityId`) também permite reprocessar quando o algoritmo evoluir.

### Extensões Postgres via migration raw SQL
`unaccent` e `pg_trgm` são extensões padrão/contrib do Postgres, habilitadas via `CREATE EXTENSION IF NOT EXISTS` na migration, seguindo exatamente o padrão já usado para `postgis` na migration inicial (não usa o recurso de `extensions` do Prisma, que não está habilitado no schema atual).

## Risks / Trade-offs

- **[Risco] Frase de abrangência estadual não prevista na lista fixa** → Mitigação: limiar de similaridade alto (0.65) como defesa em profundidade; lista pode ser expandida facilmente no futuro sem migration.
- **[Risco] Microrregiões nominadas (ex.: "Região Metropolitana de Curitiba") ficam sempre não resolvidas** → Aceito como Non-Goal explícito; comportamento seguro (não resolvido, nunca um match errado).
- **[Trade-off] Substituição total do conjunto de municípios a cada resolução** → aceito porque é um índice derivado, não um registro de auditoria; simplifica a lógica (sem necessidade de diff incremental).
- **[Risco] Prefixos incomuns não cobertos pela lista de remoção (ex.: "Cidade-sede de ")** → Mitigação: cai para correspondência de trigrama, que ainda pode superar 0.65 dependendo do caso; caso contrário, fica não resolvido (seguro).

## Migration Plan

1. Migration Prisma aditiva: `CREATE EXTENSION IF NOT EXISTS unaccent;`, `CREATE EXTENSION IF NOT EXISTS pg_trgm;`, novo model `OpportunityMunicipality`, novo campo `Opportunity.coversEntireState Boolean @default(false)`.
2. Nenhuma migração de dados necessária — `OpportunityMunicipality` começa vazia; resolução roda automaticamente a partir de análises de IA já existentes quando reprocessadas manualmente, ou a partir de novas análises.
3. Rollback: reverter a migration aditiva (nenhum dado de negócio é perdido além do próprio índice derivado, que pode ser recalculado).

## Open Questions

Nenhuma pendente — decisões de modelagem e algoritmo já validadas com o usuário e com testes reais antes da escrita deste design.
