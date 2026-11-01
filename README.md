# Mapa Inteligente de Editais do Paraná

MVP de uma plataforma que centraliza editais públicos e privados de fomento no Paraná, com captura automatizada, processamento de documentos por IA e um mapa interativo de oportunidades.

Este repositório está organizado como um monorepo (`npm workspaces`) com:

- `backend/` — API NestJS + Prisma (PostgreSQL/PostGIS) + BullMQ/Redis
- `frontend/` — React + Vite + Tailwind CSS + shadcn/ui

A implementação segue o processo de changes do [OpenSpec](openspec/), em `openspec/changes/`. Esta primeira change (`foundation-setup`) entrega apenas a fundação do projeto: estrutura, banco de dados e módulos esqueleto — sem lógica de negócio ainda.

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

   O seed popula as categorias iniciais e os 399 municípios do Paraná (nome, código IBGE, latitude/longitude e o campo geográfico PostGIS).

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

7. **Rodar os workers** (stubs nesta etapa — conectam à fila, sem processadores de negócio ainda)

   ```bash
   cd backend
   npm run build
   npm run worker:scraper
   npm run worker:document
   npm run worker:ai-analysis
   npm run worker:geolocation
   npm run worker:notification
   ```

## Adicionando um novo módulo de domínio

Os módulos em `backend/src/modules/*` seguem o padrão NestJS (`*.module.ts` + `*.controller.ts` + `*.service.ts`), registrados em `backend/src/app.module.ts`. Infraestrutura compartilhada (banco, fila, config, logger, exceções, storage, validadores) vive em `backend/src/shared/*` e é importada pelos módulos de domínio conforme necessário.

## Status do projeto

Acompanhe o roteiro de implementação em `openspec/changes/`. Cada change corresponde a uma etapa incremental do MVP (fundação, scrapers, pipeline de documentos, IA, geolocalização, API, frontend, etc.).
