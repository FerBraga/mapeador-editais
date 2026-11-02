## MODIFIED Requirements

### Requirement: Schema Prisma Completo do Domínio
O sistema SHALL definir, via Prisma, o schema completo das entidades do domínio descritas no planejamento do produto: `User`, `Source`, `ScraperExecution`, `Category`, `Municipality`, `Opportunity`, `Document`, `AIAnalysis`, `RequiredDocument`, `OpportunityMunicipality`, `UserFavoriteLocation` e `Notification`, incluindo seus campos, enums de status e relacionamentos entre entidades.

#### Scenario: Geração do Prisma Client
- **WHEN** o comando `prisma generate` é executado sobre o schema
- **THEN** o Prisma Client é gerado sem erros, expondo tipos e métodos para todas as entidades listadas

#### Scenario: Aplicação da migration inicial
- **WHEN** o comando `prisma migrate dev` é executado contra um banco PostgreSQL vazio com PostGIS habilitado
- **THEN** todas as tabelas, enums, índices e relacionamentos do schema são criados sem erros

#### Scenario: Valores monetários usam tipo decimal
- **WHEN** os campos `fundingMin` e `fundingMax` da entidade `Opportunity` são inspecionados no schema
- **THEN** ambos são declarados com tipo `Decimal`, nunca `Float` ou `Int`
