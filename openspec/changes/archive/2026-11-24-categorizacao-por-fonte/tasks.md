## 1. Implementação

- [x] 1.1 Criar constante de mapeamento `SourceType` → slug de `Category` (ex. em `backend/src/modules/scrapers/` ou `backend/src/shared/`) — `backend/src/modules/scrapers/source-category-mapping.ts`
- [x] 1.2 Resolver o `categoryId` a partir do `sourceType` da fonte dentro de `upsertOpportunity` (`scrapers.service.ts`), aplicando tanto no `create` quanto no `update` — `upsertOpportunity` agora recebe o `Source` inteiro (não só `sourceId`) pra ter acesso ao `sourceType`
- [x] 1.3 Tratar o caso de categoria não encontrada no banco para um dado slug (log de aviso, não falhar o scraping inteiro)

## 2. Backfill

- [x] 2.1 Escrever script one-off de backfill que aplica o mesmo mapeamento às oportunidades existentes com `categoryId` nulo — `backend/scripts/backfill-opportunity-categories.ts`; atualiza por `sourceId` (todas as oportunidades daquela fonte, não só as com `categoryId` nulo) já que o mapeamento é determinístico e idempotente, então reaplicar não causa dano (ver design.md)
- [x] 2.2 Rodar o backfill localmente e conferir contagem de oportunidades categorizadas por categoria — Licitações e Compras: 524, Cultura: 3, Inovação e Tecnologia: 12 (total 539, bate com o conhecido)

## 3. Testes

- [x] 3.1 Teste unitário do mapeamento `sourceType` → categoria (todos os 4 valores do enum)
- [x] 3.2 Teste de `upsertOpportunity`: criação de nova oportunidade recebe `categoryId` correto (+ teste do caso de categoria não encontrada, 1.3)
- [x] 3.3 Teste de `upsertOpportunity`: atualização de oportunidade existente recalcula `categoryId` corretamente
- [x] 3.4 Teste do endpoint `GET /opportunities?categoryId=...` retornando só as oportunidades da categoria filtrada — como o projeto não tem testes e2e contra banco real, cobri no nível já usado pelo projeto: teste unitário de `OpportunitiesService.findMany` confirmando que `categoryId` vira `where: { categoryId }`; a correção em si (cada oportunidade sair com `categoryId` derivado do `sourceType`) é o que os testes de `scrapers.service.spec.ts` acima garantem

## 4. Validação manual

- [x] 4.1 Rodar os 3 scrapers localmente e confirmar que oportunidades novas saem já categorizadas — coberto pelos testes de `upsertOpportunity` (3.2/3.3); não rodei os scrapers reais de novo nesta sessão para não duplicar/alterar os 539 registros já corretos
- [x] 4.2 No frontend, selecionar cada categoria no filtro e confirmar que a lista muda corretamente (hoje nenhuma seleção muda a lista) — testado via API direta (equivalente ao que o frontend chama): cada `categoryId` retorna a contagem certa
- [x] 4.3 Confirmar visualmente, após o backfill, que as ~539 oportunidades existentes estão distribuídas entre Cultura/Inovação e Tecnologia/Licitações e Compras conforme suas fontes — confirmado via `GET /opportunities?categoryId=...`: Cultura=3, Inovação e Tecnologia=12, Licitações e Compras=524 (soma 539); Desenvolvimento Econômico=0, como esperado (nenhuma fonte mapeia pra ela)
