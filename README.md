# Mapa Inteligente de Editais do Paraná

MVP de uma plataforma que centraliza editais públicos e privados de fomento no Paraná, com captura automatizada, processamento de documentos por IA e um mapa interativo de oportunidades.

Este repositório está organizado como um monorepo (`npm workspaces`) com:

- `backend/` — API NestJS + Prisma (PostgreSQL/PostGIS) + BullMQ/Redis
- `frontend/` — React + Vite + Tailwind CSS + shadcn/ui

A implementação segue o processo de changes do [OpenSpec](openspec/), em `openspec/changes/`. `foundation-setup`, `primeiro-scraper` e `expansao-scrapers` já estão arquivadas em `openspec/changes/archive/`; a change `pipeline-documentos` adiciona o download e a extração de texto dos anexos capturados pelos scrapers.

**Fontes de editais ativas:**

- **Cultura SEEC-PR** (`cultura-pr`) — scraping de `www.cultura.pr.gov.br`.
- **Fundação Araucária** (`fundacao-araucaria`) — scraping de `www.fappr.pr.gov.br/Programas-Abertos`.
- **Compras Públicas PR** (`pncp-pr`) — consumo da API pública do PNCP (Portal Nacional de Contratações Públicas), filtrada por `uf=PR` e restrita a órgãos estaduais (`esferaId = "E"`). **Desvio do planejamento original**: a fonte originalmente prevista era o sistema GMS do "Compras Paraná" (`gms.pr.gov.br`), mas ele exige resolução de captcha em qualquer consulta, tornando-o inviável para scraping automatizado; o Portal da Transparência do Paraná também foi avaliado e descartado (bloqueado por `robots.txt`). A API do PNCP cobre a mesma necessidade de negócio (licitações do governo estadual) de forma pública e sem captcha.

## Pré-requisitos

- Node.js 20+
- Docker e Docker Compose

## Setup local

1. **Variáveis de ambiente**

   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

   Ajuste `POSTGRES_PORT`/`REDIS_PORT` (raiz) e `DATABASE_URL`/`REDIS_PORT` (backend) se as portas padrão (5433/6380) colidirem com algo já rodando na sua máquina — mantenha os dois arquivos consistentes entre si.

   `SHADOW_DATABASE_URL` (backend) é usada apenas pelo Prisma CLI para o shadow database de `migrate dev`. Como o PostGIS não é herdado automaticamente por um banco criado do zero, crie-o manualmente uma vez: `docker exec mapeador-editais-postgres psql -U mapeador -d postgres -c "CREATE DATABASE mapeador_editais_shadow;"` (o `template1` já tem PostGIS habilitado neste ambiente, então o novo banco herda automaticamente).

   `STORAGE_LOCAL_DIR` (backend) define onde os anexos baixados são salvos em disco (padrão `uploads`, relativo ao diretório de execução — `backend/uploads/` em uso normal).

2. **Instalar dependências**

   ```bash
   npm install
   ```

3. **Subir Postgres+PostGIS e Redis**

   ```bash
   docker compose up -d
   ```

4. **Rodar migrations e seed**

   ```bash
   cd backend
   npx prisma migrate deploy
   npx prisma db seed
   cd ..
   ```

   O seed popula as categorias iniciais, os 399 municípios do Paraná (nome, código IBGE, latitude/longitude e o campo geográfico PostGIS) e as 3 fontes de scraping cadastradas (Cultura SEEC-PR, Fundação Araucária, Compras Públicas PR/PNCP).

5. **Rodar o backend**

   ```bash
   npm run dev:backend
   ```

   - Health-check: `GET http://localhost:3000/api/v1/health`
   - Documentação Swagger: `http://localhost:3000/docs`

6. **Rodar o frontend**

   ```bash
   npm run dev:frontend
   ```

   Acesse `http://localhost:5173`. A página inicial consulta o health-check da API para confirmar a conexão.

7. **Rodar os workers**

   ```bash
   cd backend
   npm run build
   npm run worker:scraper       # consome a fila "scrapers"
   npm run worker:document      # consome a fila "documents" (download + extração de texto de PDFs)
   npm run worker:ai-analysis   # stub — sem processador ainda
   npm run worker:geolocation   # stub — sem processador ainda
   npm run worker:notification  # stub — sem processador ainda
   ```

   O worker `scraper` registra automaticamente um job diário (03:00) por fonte e consome a fila; a API apenas enfileira (não processa) execuções. Ao criar um novo anexo, o scraper enfileira automaticamente seu processamento na fila `documents` — o worker `document` precisa estar rodando para que isso avance.

8. **Disparar uma captura manualmente**

   Com o backend e o `worker:scraper` rodando:

   ```bash
   curl -X POST http://localhost:3000/api/v1/scrapers/cultura-pr/run
   curl -X POST http://localhost:3000/api/v1/scrapers/fundacao-araucaria/run
   curl -X POST http://localhost:3000/api/v1/scrapers/pncp-pr/run
   ```

   A API responde `202 Accepted` com o `jobId` imediatamente; o resultado fica registrado em `scraper_executions` depois que o worker processa o job.

9. **Reprocessar um documento manualmente**

   ```bash
   curl -X POST http://localhost:3000/api/v1/documents/<id>/reprocess
   ```

   Útil para documentos com `extractionStatus = FAILED`. Reseta o documento para `PENDING` e enfileira uma nova tentativa, sem criar um registro duplicado.

## Adicionando um novo módulo de domínio

Os módulos em `backend/src/modules/*` seguem o padrão NestJS (`*.module.ts` + `*.controller.ts` + `*.service.ts`), registrados em `backend/src/app.module.ts`. Infraestrutura compartilhada (banco, fila, config, logger, exceções, storage, validadores) vive em `backend/src/shared/*` e é importada pelos módulos de domínio conforme necessário.

## Adicionando uma nova fonte de scraping

O `scraper-framework` (`backend/src/modules/scrapers/`) cuida de normalização, deduplicação, lock de execução, registro em `ScraperExecution` e agendamento — uma nova fonte só precisa implementar a captura específica do portal:

1. Crie `backend/src/modules/scrapers/<fonte>/<fonte>.scraper.ts` implementando `NoticeScraper` (`sourceKey`, `fetchOpportunities()`, `fetchOpportunityDetails(externalId)`).
2. Extraia o parsing de HTML para `<fonte>.mapper.ts` (funções puras, fáceis de testar com fixtures) e o acesso HTTP (rate limit + `User-Agent`) para um client dedicado, seguindo o padrão de `scrapers/cultura-pr/`.
3. Registre o novo scraper como provider em `scrapers.module.ts` e adicione-o ao array retornado pela factory do token `NOTICE_SCRAPERS`.
4. Cadastre o `Source` correspondente (via `prisma/seed.ts`), com `scraperKey` igual ao `sourceKey` da nova classe.
5. Adicione o `scraperKey` à lista `DAILY_SCRAPER_KEYS` em `scrapers.constants.ts` para que o agendamento diário o inclua.
6. Crie fixtures HTML reais em `<fonte>/__fixtures__/` e testes unitários do mapper/scraper sem acesso de rede real (mock do client HTTP), seguindo `cultura-pr/__tests__/`.

## Status do projeto

Acompanhe o roteiro de implementação em `openspec/changes/`. Cada change corresponde a uma etapa incremental do MVP (fundação, scrapers, pipeline de documentos, IA, geolocalização, API, frontend, etc.).
