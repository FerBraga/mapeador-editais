## ADDED Requirements

### Requirement: Categorização automática na captura
Ao criar ou atualizar uma `Opportunity`, o sistema SHALL atribuir `categoryId` derivando-o do `sourceType` da `Source` correspondente, segundo um mapeamento fixo (`CULTURE` → "Cultura", `INNOVATION` → "Inovação e Tecnologia", `PUBLIC_PROCUREMENT` → "Licitações e Compras", `OTHER` → "Outros").

#### Scenario: Nova oportunidade recebe categoria da fonte
- **WHEN** um scraper cria uma nova `Opportunity` a partir de uma `Source` com `sourceType = CULTURE`
- **THEN** a oportunidade é criada com `categoryId` apontando para a categoria "Cultura"

#### Scenario: Atualização de oportunidade mantém categoria consistente com a fonte
- **WHEN** um scraper atualiza uma `Opportunity` existente cujo conteúdo mudou (`contentHash` diferente)
- **THEN** o `categoryId` da oportunidade é recalculado a partir do `sourceType` atual da sua fonte

### Requirement: Backfill de categorização
O sistema SHALL fornecer um script que aplica o mesmo mapeamento `sourceType` → categoria às oportunidades existentes com `categoryId` nulo, de forma idempotente.

#### Scenario: Backfill categoriza oportunidades existentes
- **WHEN** o script de backfill é executado sobre o banco de dados atual
- **THEN** toda `Opportunity` com `categoryId` nulo passa a ter `categoryId` atribuído conforme o `sourceType` da sua fonte

#### Scenario: Backfill é seguro para rodar mais de uma vez
- **WHEN** o script de backfill é executado uma segunda vez sem mudanças no banco desde a primeira execução
- **THEN** nenhuma oportunidade tem seu `categoryId` alterado para um valor diferente do já atribuído

### Requirement: Filtro por categoria retorna resultados corretos
O endpoint `GET /opportunities?categoryId=<id>` SHALL retornar apenas oportunidades cuja `categoryId` corresponde ao valor informado, agora que toda oportunidade capturada possui uma categoria atribuída.

#### Scenario: Filtro por categoria existente retorna oportunidades
- **WHEN** o cliente busca `GET /opportunities?categoryId=<id da categoria "Cultura">`
- **THEN** a resposta contém apenas oportunidades cuja fonte tem `sourceType = CULTURE`, e nenhuma outra
