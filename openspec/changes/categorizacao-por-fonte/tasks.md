## 1. Implementação

- [ ] 1.1 Criar constante de mapeamento `SourceType` → slug de `Category` (ex. em `backend/src/modules/scrapers/` ou `backend/src/shared/`)
- [ ] 1.2 Resolver o `categoryId` a partir do `sourceType` da fonte dentro de `upsertOpportunity` (`scrapers.service.ts`), aplicando tanto no `create` quanto no `update`
- [ ] 1.3 Tratar o caso de categoria não encontrada no banco para um dado slug (log de aviso, não falhar o scraping inteiro)

## 2. Backfill

- [ ] 2.1 Escrever script one-off de backfill que aplica o mesmo mapeamento às oportunidades existentes com `categoryId` nulo
- [ ] 2.2 Rodar o backfill localmente e conferir contagem de oportunidades categorizadas por categoria

## 3. Testes

- [ ] 3.1 Teste unitário do mapeamento `sourceType` → categoria (todos os 4 valores do enum)
- [ ] 3.2 Teste de `upsertOpportunity`: criação de nova oportunidade recebe `categoryId` correto
- [ ] 3.3 Teste de `upsertOpportunity`: atualização de oportunidade existente recalcula `categoryId` corretamente
- [ ] 3.4 Teste do endpoint `GET /opportunities?categoryId=...` retornando só as oportunidades da categoria filtrada (usando fixtures com fontes de `sourceType` diferentes)

## 4. Validação manual

- [ ] 4.1 Rodar os 3 scrapers localmente e confirmar que oportunidades novas saem já categorizadas
- [ ] 4.2 No frontend, selecionar cada categoria no filtro e confirmar que a lista muda corretamente (hoje nenhuma seleção muda a lista)
- [ ] 4.3 Confirmar visualmente, após o backfill, que as ~539 oportunidades existentes estão distribuídas entre Cultura/Inovação e Tecnologia/Licitações e Compras conforme suas fontes
