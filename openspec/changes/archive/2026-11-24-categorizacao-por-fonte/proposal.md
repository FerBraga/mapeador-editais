## Why

O filtro por categoria na busca de editais (`GET /opportunities?categoryId=...`) nunca retorna resultados corretos: toda a cadeia de filtro (frontend, parsing de URL, schema Zod, `where` do Prisma) está implementada corretamente, mas nenhum scraper jamais atribui `categoryId` a uma `Opportunity` ao criá-la ou atualizá-la — `categoryId` só é lido no filtro, nunca escrito em nenhum lugar do código. Resultado: toda oportunidade no banco tem `categoryId: null`, então filtrar por qualquer categoria específica nunca retorna nada. Isso não é um bug de lógica de filtro — é a ausência de qualquer mecanismo de categorização.

O model `Source` já tem um campo `sourceType` (`CULTURE`, `INNOVATION`, `PUBLIC_PROCUREMENT`, `OTHER`) corretamente preenchido para as 3 fontes ativas (Cultura SEEC-PR = `CULTURE`, Fundação Araucária = `INNOVATION`, PNCP-PR = `PUBLIC_PROCUREMENT`), mas esse campo nunca foi usado para derivar a categoria da oportunidade. Esta change fecha esse elo.

## What Changes

- Deriva `categoryId` da `Opportunity` a partir do `sourceType` da `Source` correspondente, no momento da criação/atualização pelo scraper (mapeamento fixo: `CULTURE` → categoria "Cultura", `INNOVATION` → "Inovação e Tecnologia", `PUBLIC_PROCUREMENT` → "Licitações e Compras", `OTHER` → "Outros").
- Script de backfill (one-off) que aplica esse mesmo mapeamento às oportunidades já existentes no banco, que hoje têm `categoryId` nulo.
- **Fora de escopo, por decisão explícita do usuário**: adicionar a categoria "Educação" — nenhuma das 3 fontes ativas hoje é especificamente de educação (Fundação Araucária é fomento a Ciência/Tecnologia, não educação), então a categoria ficaria sempre vazia; só será adicionada quando houver uma fonte real que a preencha. Também fora de escopo: categorização por edital individual (ex.: via IA) — o mapeamento continua por fonte, que é homogênea o suficiente para os 3 scrapers atuais.

## Capabilities

### New Capabilities
- `opportunity-source-categorization`: derivação da categoria de uma oportunidade a partir do `sourceType` da sua fonte, aplicada tanto na captura (scrapers) quanto via backfill nos dados já existentes.

### Modified Capabilities
(nenhuma — nenhuma spec existente documentava a atribuição de `categoryId`; é uma capacidade nova fechando uma lacuna, não uma mudança de comportamento já especificado)

## Impact

- Alteração nos 3 mapeadores de scraper (`backend/src/modules/scrapers/cultura-pr/`, `fundacao-araucaria/`, `pncp-pr/`) ou, preferencialmente, num ponto único compartilhado (ex. `scraper.processor.ts`, que já tem acesso à `Source` ao persistir a `Opportunity`), para evitar duplicar o mapeamento em 3 lugares.
- Script de backfill de dados, executado uma vez em produção/local após o deploy.
- Nenhuma migration de schema necessária (`categoryId` já existe na tabela `Opportunity`).
