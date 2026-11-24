## Context

`upsertOpportunity` em `backend/src/modules/scrapers/scrapers.service.ts` já recebe `sourceId` e tem acesso ao registro `Source` completo (buscado antes, em `runSource`) ao criar ou atualizar uma `Opportunity`. O `Source.sourceType` já está corretamente preenchido no seed para as 3 fontes ativas. `Category` já existe com as 5 categorias do seed. O único elo faltando é escrever `categoryId` ao persistir a oportunidade.

## Goals / Non-Goals

**Goals:**
- Toda `Opportunity` criada a partir de agora recebe `categoryId` derivado do `sourceType` da sua fonte.
- Oportunidades já existentes no banco (hoje com `categoryId` nulo) recebem a mesma categorização via backfill.

**Non-Goals:**
- Categorização por edital individual (ex.: via IA) — mantido por fonte, homogênea o suficiente hoje.
- Adicionar a categoria "Educação" — nenhuma fonte ativa a preencheria (decisão do usuário).
- Permitir que um admin recategorize manualmente uma oportunidade específica — sem painel administrativo no MVP.

## Decisions

**Mapeamento `SourceType` → `Category` como constante fixa no código, não como tabela configurável.** São só 4 valores de enum (`CULTURE`, `INNOVATION`, `PUBLIC_PROCUREMENT`, `OTHER`) mapeando para slugs de categoria já seedados (`cultura`, `inovacao-e-tecnologia`, `licitacoes-e-compras`, `outros` — `desenvolvimento-economico` fica sem fonte mapeada por enquanto, assim como ficaria "Educação"). Uma tabela de mapeamento configurável seria over-engineering para 4 valores que mudam raramente; se um 5º `SourceType` for necessário no futuro, o mapeamento fixo é trivial de estender.

**Categorização aplicada em `upsertOpportunity` (criação e atualização), não nos mapeadores de cada scraper.** Mantém a lógica em um único lugar (já tem `source` disponível no escopo), evitando triplicar a mesma regra em `cultura-pr`, `fundacao-araucaria` e `pncp-pr`. Também garante que, se a categorização mudar no futuro, baste alterar um ponto.

**Backfill como script one-off (ex. `backend/scripts/` ou comando Prisma/ts-node ad-hoc), não como migration de dados automática no deploy.** Migrations de schema Prisma não devem conter lógica de negócio (o mapeamento `sourceType` → categoria). Um script separado, executado manualmente uma vez após o deploy desta change, é mais seguro e auditável — consistente com não ter pipeline de CI/homologação automatizada neste projeto (testagem é manual/local, por decisão já registrada do usuário).

## Risks / Trade-offs

- [Oportunidades de uma fonte com `sourceType = OTHER` (nenhuma hoje) cairiam na categoria "Outros" sem granularidade] → Mitigação: aceito; nenhuma fonte ativa usa `OTHER` hoje, e é consistente com o nome da categoria.
- [Backfill rodado mais de uma vez poderia sobrescrever uma categorização manual futura, se um dia existir] → Mitigação: não há categorização manual no MVP; o script é idempotente (sempre deriva do `sourceType` atual da fonte), então rodar de novo não causa dano.

## Migration Plan

1. Deploy do código que escreve `categoryId` em `upsertOpportunity` — aditivo, não quebra nada (oportunidades novas passam a vir categorizadas; existentes continuam nulas até o passo 2).
2. Rodar o script de backfill uma vez, localmente/produção, atualizando `categoryId` de todas as oportunidades existentes com base no `sourceType` da sua fonte.
3. Rollback: reverter o código de `upsertOpportunity` é seguro (novas oportunidades voltam a não ter categoria); reverter o backfill, se necessário, é um `UPDATE` setando `categoryId = NULL` nas oportunidades afetadas.
