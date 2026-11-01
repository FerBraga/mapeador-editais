## Purpose

Schema Prisma completo com todas as entidades do domínio, tipos geográficos PostGIS e dados de seed (categorias e municípios do Paraná) que sustentam o restante do MVP Mapa Inteligente de Editais do Paraná.

## Requirements

### Requirement: Schema Prisma Completo do Domínio
O sistema SHALL definir, via Prisma, o schema completo das entidades do domínio descritas no planejamento do produto: `User`, `Source`, `ScraperExecution`, `Category`, `Municipality`, `Opportunity`, `Document`, `AIAnalysis`, `RequiredDocument`, `UserFavoriteLocation` e `Notification`, incluindo seus campos, enums de status e relacionamentos entre entidades.

#### Scenario: Geração do Prisma Client
- **WHEN** o comando `prisma generate` é executado sobre o schema
- **THEN** o Prisma Client é gerado sem erros, expondo tipos e métodos para todas as entidades listadas

#### Scenario: Aplicação da migration inicial
- **WHEN** o comando `prisma migrate dev` é executado contra um banco PostgreSQL vazio com PostGIS habilitado
- **THEN** todas as tabelas, enums, índices e relacionamentos do schema são criados sem erros

#### Scenario: Valores monetários usam tipo decimal
- **WHEN** os campos `fundingMin` e `fundingMax` da entidade `Opportunity` são inspecionados no schema
- **THEN** ambos são declarados com tipo `Decimal`, nunca `Float` ou `Int`

### Requirement: Tipo Geográfico PostGIS para Municípios
A entidade `Municipality` SHALL possuir um campo geográfico (`location`) do tipo `Point` com SRID 4326, armazenado via PostGIS, além dos campos de latitude e longitude em formato numérico simples.

#### Scenario: Consulta geográfica funcional
- **WHEN** uma query SQL raw utiliza o campo `location` de `Municipality` com uma função espacial do PostGIS (ex.: `ST_DWithin`)
- **THEN** a query executa com sucesso e retorna resultados geograficamente corretos

#### Scenario: Latitude e longitude consistentes com a geografia
- **WHEN** um município é lido do banco de dados
- **THEN** os valores de `latitude` e `longitude` retornados correspondem à posição representada no campo `location`

### Requirement: Identificação e Deduplicação de Oportunidades
A entidade `Opportunity` SHALL possuir os campos `externalId`, `sourceId`, `officialUrl` e `contentHash`, de forma que uma mesma oportunidade capturada repetidamente da mesma fonte possa ser identificada como já existente em vez de duplicada.

#### Scenario: Restrição de unicidade por fonte e identificador externo
- **WHEN** uma tentativa de inserção cria uma `Opportunity` com o mesmo par (`sourceId`, `externalId`) de um registro já existente
- **THEN** o banco de dados rejeita a inserção duplicada por violação de restrição de unicidade

### Requirement: Preservação de Dados Originais e Histórico de Análises
As entidades `Opportunity` e `AIAnalysis` SHALL preservar, respectivamente, os dados brutos capturados (`rawData`) e o histórico completo de análises de IA já realizadas, sem que uma nova análise sobrescreva ou apague registros anteriores.

#### Scenario: Nova análise não remove análises anteriores
- **WHEN** uma nova `AIAnalysis` é criada para uma `Opportunity` que já possui análises anteriores
- **THEN** os registros de `AIAnalysis` anteriores permanecem no banco de dados, associados à mesma oportunidade

#### Scenario: Dados brutos preservados após atualização
- **WHEN** uma `Opportunity` existente é atualizada com novos dados capturados pelo scraper
- **THEN** o campo `rawData` reflete a captura mais recente sem perder a capacidade de auditoria dos dados originalmente capturados, conforme definido pelo processo de atualização do scraper

### Requirement: Seed de Categorias e Municípios do Paraná
O sistema SHALL fornecer um script de seed que popula a tabela `Category` com as categorias iniciais definidas no planejamento (Cultura, Inovação e Tecnologia, Licitações e Compras, Desenvolvimento Econômico, Outros) e a tabela `Municipality` com todos os municípios do estado do Paraná, incluindo código IBGE e coordenadas geográficas.

#### Scenario: Execução do seed em banco vazio
- **WHEN** o script de seed é executado contra um banco de dados recém-migrado
- **THEN** todas as categorias iniciais e todos os municípios do Paraná são inseridos, cada município com código IBGE e coordenadas válidas

#### Scenario: Seed é idempotente
- **WHEN** o script de seed é executado mais de uma vez contra o mesmo banco de dados
- **THEN** nenhuma categoria ou município é duplicado como resultado da segunda execução
