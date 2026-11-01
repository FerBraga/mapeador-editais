## 1. Repositório e Monorepo

- [x] 1.1 Inicializar repositório git na raiz do projeto (`.gitignore` cobrindo `node_modules`, `dist`, `.env`, uploads locais)
- [x] 1.2 Criar estrutura de workspaces npm na raiz (`package.json` raiz com `workspaces: ["backend", "frontend"]`)
- [x] 1.3 Criar diretórios `backend/` e `frontend/` com `package.json` próprios

## 2. Infraestrutura de Desenvolvimento (Docker Compose)

- [x] 2.1 Criar `docker-compose.yml` com serviço PostgreSQL usando imagem com PostGIS habilitado (ex.: `postgis/postgis`)
- [x] 2.2 Adicionar serviço Redis ao `docker-compose.yml`
- [x] 2.3 Criar `.env.example` na raiz e em `backend/` com as variáveis necessárias (`DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`, `PORT`, etc.)
- [x] 2.4 Validar que `docker compose up` sobe Postgres+PostGIS e Redis acessíveis localmente (portas 5433/6380 no host para não colidir com outros projetos já rodando nesta máquina)

## 3. Backend — Base NestJS

- [x] 3.1 Inicializar projeto NestJS em `backend/` com TypeScript
- [x] 3.2 Configurar `shared/config` com carregamento e validação de variáveis de ambiente (ex.: `@nestjs/config` + schema Zod), falhando a inicialização se variável obrigatória faltar
- [x] 3.3 Configurar `shared/logger` com um logger estruturado compartilhado (JSON lines via `StructuredLoggerService`)
- [x] 3.4 Configurar `shared/exceptions` com filtro global de exceções e formato de resposta de erro padronizado
- [x] 3.5 Configurar Swagger/OpenAPI servindo em `/docs` (validado: HTTP 200)
- [x] 3.6 Criar endpoint `GET /api/v1/health` verificando conectividade com o banco de dados (validado: `{"status":"ok","database":"ok",...}`)
- [x] 3.7 Configurar `ValidationPipe` global (whitelist + transform) para rejeitar payloads não previstos nos DTOs (configurado; sem endpoint de negócio ainda para testar ponta a ponta — será exercitado nas próximas changes)
- [x] 3.8 Configurar CORS restritivo (origens permitidas via variável de ambiente) e cabeçalhos de segurança básicos (ex.: `helmet`) (validado: origem permitida recebe `Access-Control-Allow-Origin`, origem não listada não recebe; headers do helmet presentes)
- [x] 3.9 Validar que `backend` builda e inicia sem erros (`nest build` limpo, app inicia e mapeia todas as rotas)

## 4. Banco de Dados — Schema Prisma

- [x] 4.1 Inicializar Prisma em `backend/` apontando para `DATABASE_URL` (Prisma 6.19.3, pinado para manter o formato clássico de schema; Prisma 7+ moveu `url` para `prisma.config.ts`)
- [x] 4.2 Modelar entidade `User` (autenticação) no schema
- [x] 4.3 Modelar entidade `Source` e enum de `source_type` (PUBLIC_PROCUREMENT, CULTURE, INNOVATION, OTHER)
- [x] 4.4 Modelar entidade `ScraperExecution` com enum de status (PENDING, RUNNING, COMPLETED, FAILED, PARTIALLY_COMPLETED) e relação com `Source`
- [x] 4.5 Modelar entidade `Category`
- [x] 4.6 Modelar entidade `Municipality`, incluindo `ibgeCode`, `latitude`, `longitude` e campo geográfico `location` (`Unsupported("geography(Point, 4326)")`)
- [x] 4.7 Modelar entidade `Opportunity` com todos os campos descritos no planejamento (incluindo `externalId`, `contentHash`, `rawData`, valores monetários como `Decimal`, enum de status), relações com `Source`, `Category` e `Municipality`, e restrição de unicidade em (`sourceId`, `externalId`)
- [x] 4.8 Modelar entidade `Document` com enum de `extraction_status` (PENDING, PROCESSING, COMPLETED, FAILED) e relação com `Opportunity`
- [x] 4.9 Modelar entidade `AIAnalysis` com relação para `Opportunity` e `Document`, preservando histórico (sem update destrutivo)
- [x] 4.10 Modelar entidade `RequiredDocument` com enum de `document_category` (LEGAL, TAX, FINANCIAL, TECHNICAL, DECLARATION, OTHER)
- [x] 4.11 Modelar entidade `UserFavoriteLocation` relacionando `User` e `Municipality`
- [x] 4.12 Modelar entidade `Notification` com restrição para evitar duplicidade de envio
- [x] 4.13 Criar migration inicial (`prisma migrate dev`) e validar aplicação em banco limpo com PostGIS habilitado (migration `20261101171331_init` aplicada com sucesso; `location` confirmado como `geography(Point,4326)`)
- [x] 4.14 Criar índices necessários (ex.: busca por município, status, categoria, datas de inscrição)

## 5. Banco de Dados — Seed

- [x] 5.1 Levantar fonte de dados confiável dos municípios do Paraná (código IBGE, nome, latitude/longitude) — dataset `kelvins/municipios-brasileiros` (IBGE), filtrado para `codigo_uf = 41`, 399 municípios confirmados
- [x] 5.2 Criar script de seed idempotente para `Category` (Cultura, Inovação e Tecnologia, Licitações e Compras, Desenvolvimento Econômico, Outros)
- [x] 5.3 Criar script de seed idempotente para todos os municípios do Paraná, populando `latitude`/`longitude` e o campo geográfico `location` via SQL raw (`ON CONFLICT (ibge_code) DO UPDATE`)
- [x] 5.4 Validar execução do seed em banco vazio e reexecução sem duplicar registros (5 categorias / 399 municípios em ambas as execuções)

## 6. Backend — Estrutura de Módulos de Domínio

- [x] 6.1 Criar módulo `auth` (esqueleto: `AuthModule`, `AuthController`, `AuthService` vazios, registrado no `AppModule`)
- [x] 6.2 Criar módulo `users` (esqueleto)
- [x] 6.3 Criar módulo `sources` (esqueleto)
- [x] 6.4 Criar módulo `scrapers` (esqueleto)
- [x] 6.5 Criar módulo `opportunities` (esqueleto)
- [x] 6.6 Criar módulo `documents` (esqueleto)
- [x] 6.7 Criar módulo `ai-analysis` (esqueleto)
- [x] 6.8 Criar módulo `geolocation` (esqueleto)
- [x] 6.9 Criar módulo `categories` (esqueleto)
- [x] 6.10 Criar módulo `alerts` (esqueleto)
- [x] 6.11 Criar módulo `notifications` (esqueleto)
- [x] 6.12 Criar `shared/database` expondo o Prisma Client como provider injetável para os demais módulos
- [x] 6.13 Validar que a aplicação inicializa com todos os módulos registrados, sem erros de dependência circular (confirmado nos logs de start: todos os 11 módulos + shared inicializados)

## 7. Backend — Fila (Redis/BullMQ) Sem Lógica de Negócio

- [x] 7.1 Criar `shared/queue` com configuração de conexão BullMQ/Redis, sem registrar filas de negócio
- [x] 7.2 Validar que o backend inicializa a conexão com Redis com sucesso (`BullModule` inicializado nos logs de start; `PING` -> `PONG` confirmado contra `localhost:6380`)

## 8. Backend — Workers (Stubs)

- [x] 8.1 Criar `workers/scraper.worker.ts` como entrypoint independente, inicializando contexto Nest e conexão de fila
- [x] 8.2 Criar `workers/document.worker.ts` (stub)
- [x] 8.3 Criar `workers/ai-analysis.worker.ts` (stub)
- [x] 8.4 Criar `workers/geolocation.worker.ts` (stub)
- [x] 8.5 Criar `workers/notification.worker.ts` (stub)
- [x] 8.6 Validar que cada worker inicia como processo independente sem exigir que a API esteja rodando (validado com `scraper.worker.js`: inicializa todos os módulos e a fila sem abrir porta HTTP)

## 9. Frontend — Base React/Vite

- [x] 9.1 Inicializar projeto Vite + React + TypeScript em `frontend/`
- [x] 9.2 Configurar Tailwind CSS (v4, via `@tailwindcss/vite`)
- [x] 9.3 Configurar shadcn/ui (`npx shadcn init`, estilo `base-nova`, componente `button` de exemplo gerado)
- [x] 9.4 Configurar React Router com rota inicial (`/` → `HomePage`)
- [x] 9.5 Configurar TanStack Query (provider na raiz da aplicação)
- [x] 9.6 Criar página inicial mínima confirmando que a aplicação builda e roda
- [x] 9.7 Validar build de produção (`vite build`) e execução do servidor de desenvolvimento (ambos validados; dev server respondeu HTTP 200 em `:5173`)

## 10. Validação Final

- [x] 10.1 Validar fluxo completo: `docker compose up` → migrations → seed → backend `start` → `GET /api/v1/health` retorna 200 → `/docs` acessível (validado do zero, com volumes recriados: migration `20261101171331_init` aplicada, seed com 5 categorias/399 municípios, health 200, docs 200)
- [x] 10.2 Validar que o frontend builda e exibe a página inicial apontando (mesmo que estático) para a existência da API (`HomePage` consulta `/health` via TanStack Query e exibe o status da API/banco)
- [x] 10.3 Documentar no README da raiz os passos de setup (variáveis de ambiente, docker compose, migrations, seed, start de backend/frontend/workers)
