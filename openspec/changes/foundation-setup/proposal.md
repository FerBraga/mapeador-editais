## Why

O MVP "Mapa Inteligente de Editais do Paraná" não possui ainda nenhum código, banco de dados ou estrutura de projeto. Antes de implementar scraping, pipeline de documentos, análise por IA, geolocalização, API ou frontend, é necessário estabelecer a fundação: estrutura de monorepo com a stack obrigatória (NestJS/Prisma/PostGIS no backend, React/Vite no frontend), o schema completo do banco de dados que todas as entidades do domínio vão usar, e a organização modular do backend que as próximas partes vão preencher. Sem essa base, qualquer change subsequente não tem onde se apoiar.

## What Changes

- Criar estrutura de monorepo com dois workspaces: `backend` (NestJS + TypeScript) e `frontend` (React + TypeScript + Vite).
- Configurar ferramentas base do backend: Prisma ORM, conexão PostgreSQL com extensão PostGIS habilitada, Redis/BullMQ (apenas configuração de conexão, sem filas de negócio ainda), Swagger/OpenAPI, variáveis de ambiente (`.env` + validação), logger e tratamento de exceções compartilhados.
- Modelar e migrar o schema completo do banco de dados (Prisma) com todas as entidades do domínio: `Users`, `Sources`, `ScraperExecutions`, `Categories`, `Municipalities` (com coluna geográfica PostGIS `Point`/SRID 4326), `Opportunities`, `Documents`, `AIAnalyses`, `RequiredDocuments`, `UserFavoriteLocations`, `Notifications` — incluindo enums de status e relacionamentos, mas sem dados de negócio além de seed de categorias e municípios do Paraná.
- Criar a estrutura de módulos do backend (`modules/auth`, `users`, `sources`, `scrapers`, `opportunities`, `documents`, `ai-analysis`, `geolocation`, `categories`, `alerts`, `notifications`) e `shared/` (`database`, `queue`, `storage`, `logger`, `exceptions`, `config`, `validators`) como esqueletos — cada módulo com seu `*.module.ts` registrado no `AppModule`, sem regras de negócio ainda (serviços/controllers vazios ou com endpoint de health-check quando aplicável).
- Criar o diretório `workers/` com os arquivos de entrada dos workers (scraper, document, ai-analysis, geolocation, notification) como stubs que apenas inicializam a conexão com a fila, sem lógica de processamento.
- Configurar o frontend base: Vite + React + TypeScript, Tailwind CSS, shadcn/ui, React Router, TanStack Query — com uma página inicial mínima que apenas confirma que a aplicação builda e roda.
- Configurar Docker Compose (ou scripts equivalentes) para levantar PostgreSQL+PostGIS e Redis localmente para desenvolvimento.

Fora de escopo nesta change (fica para partes seguintes): implementação de scrapers reais, download/extração de PDFs, integração com IA, geocodificação via Nominatim, endpoints de negócio da API REST, autenticação funcional, e UI além da página inicial.

## Capabilities

### New Capabilities
- `project-scaffolding`: estrutura de monorepo, configuração de ambiente, tooling e scripts de desenvolvimento para backend e frontend.
- `database-schema`: schema Prisma completo com todas as entidades do domínio, tipos geográficos PostGIS e migrações aplicáveis.
- `backend-module-structure`: organização modular do backend (módulos de domínio + `shared/` + `workers/`) com os esqueletos que as próximas changes vão implementar.

### Modified Capabilities
<!-- Nenhuma capability existente — projeto greenfield, openspec/specs/ está vazio. -->

## Impact

- **Novo código**: estrutura completa de diretórios em `backend/` e `frontend/`, `prisma/schema.prisma` e migrações iniciais, `docker-compose.yml` (ou equivalente) para Postgres+PostGIS e Redis.
- **Dependências novas**: NestJS, Prisma, BullMQ, Redis client, Swagger, React, Vite, Tailwind CSS, shadcn/ui, React Router, TanStack Query, Zod, React Hook Form (configuração base; uso pleno vem em changes futuras).
- **Infraestrutura**: requer PostgreSQL com extensão PostGIS e uma instância Redis acessível em ambiente de desenvolvimento.
- **Sem impacto em sistemas externos**: nenhuma integração com portais de editais, OpenAI ou Nominatim é feita nesta change.
