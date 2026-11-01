## Context

Projeto greenfield (sem código, sem repositório git ainda). O planejamento técnico do produto define uma stack obrigatória e uma arquitetura modular com processamento assíncrono (scrapers → fila → download/extração/geocodificação → IA → API → frontend). Esta change constrói apenas a base sobre a qual as partes de negócio (scraping, documentos, IA, geolocalização, API, frontend) serão implementadas em changes futuras. Não há specs ou código legado com os quais precisar ser compatível.

## Goals / Non-Goals

**Goals:**
- Monorepo com `backend/` (NestJS) e `frontend/` (React/Vite) rodando localmente (`build` e `start` funcionam).
- Schema Prisma completo e migrado, incluindo tipo geográfico PostGIS para `Municipalities`, pronto para ser populado pelas próximas changes.
- Estrutura de módulos do backend espelhando a organização de domínio definida no planejamento, registrada no `AppModule`, sem lógica de negócio.
- Workers com entrypoint próprio (processo independente da API), mas sem processadores de job reais ainda.
- Ambiente de desenvolvimento reproduzível (Postgres+PostGIS e Redis via Docker Compose).

**Non-Goals:**
- Nenhuma lógica de scraping, extração de PDF, chamada a LLM ou geocodificação real.
- Nenhum endpoint de negócio além de um health-check.
- Nenhuma autenticação funcional (o módulo `auth` existe como esqueleto, mas login/registro reais vêm em change futura).
- Nenhum deploy em VPS/EC2 — isso é tratado quando houver algo deployável.

## Decisions

**Monorepo com workspaces npm (sem Nx/Turborepo).** O projeto é um MVP com dois pacotes (`backend`, `frontend`); uma ferramenta de monorepo dedicada adicionaria complexidade desnecessária nesta fase. Alternativa considerada: dois repositórios separados — rejeitada porque dificulta versionar schema/contratos compartilhados (tipos, DTOs) entre as partes.

**Prisma como única fonte de verdade do schema, com PostGIS via SQL nativo nas migrations.** O Prisma Client não modela nativamente o tipo `geography`/`geometry` do PostGIS, então o campo `location` de `Municipalities` é declarado como `Unsupported("geography(Point, 4326)")` no schema e populado/consultado via `$queryRaw` quando necessário. Alternativa considerada: TypeORM (tem suporte mais direto a tipos espaciais) — rejeitada porque o planejamento já define Prisma como stack obrigatória.

**BullMQ/Redis configurado nesta change, filas de negócio criadas nas changes seguintes.** A conexão Redis e um módulo `QueueModule` compartilhado (`shared/queue`) são criados agora para que workers e API falem o mesmo protocolo de fila desde o início, evitando retrabalho de configuração depois. Nenhuma queue com processor real é registrada ainda.

**Workers como entrypoints Node separados (`workers/*.worker.ts`), não um módulo Nest adicional.** Isso reflete a decisão do planejamento de que workers rodam em processos independentes da API, mas podem reaproveitar módulos/serviços Nest via `NestFactory.createApplicationContext`. Alternativa considerada: tudo dentro do mesmo processo da API usando `@nestjs/bull` processors — rejeitada porque o planejamento exige processos independentes para isolar falhas de scraping/IA do tráfego da API.

**Seed mínimo de `Categories` e `Municipalities` do Paraná nesta change.** Sem os 399 municípios (ou ao menos uma base confiável deles) e as categorias iniciais, nenhuma change futura (scraping, geolocalização, API de mapa) tem dados para referenciar. O seed usa uma fonte de dados geográficos do IBGE; a exatidão fina das coordenadas pode ser refinada depois via Nominatim (fora de escopo aqui).

## Risks / Trade-offs

- [PostGIS como `Unsupported` no Prisma reduz type-safety nas queries geográficas] → Mitigar isolando todo acesso espacial em `shared/database` (ou no módulo `geolocation` futuro) via métodos tipados que encapsulam o `$queryRaw`, nunca espalhando SQL raw pelo resto do código.
- [Seed de 399 municípios pode ter coordenadas de baixa precisão se a fonte usada for incompleta] → Documentar a fonte usada no seed e deixar explícito que a geolocalização fina (Nominatim) é tratada na change de geolocalização.
- [Estrutura de módulos vazia pode "engessar" decisões antes de as próximas changes definirem a real necessidade de cada um] → Manter os esqueletos deliberadamente mínimos (module + arquivo de teste de registro), evitando interfaces ou abstrações especulativas que a change de negócio ainda não pediu.
- [Docker Compose para Postgres+PostGIS/Redis é só para dev, não para produção] → Deixar claro no README que a infra de produção (VPS/EC2, PM2/Docker, Nginx) é tratada em change de deploy futura, fora do escopo deste MVP inicial.

## Migration Plan

Não aplicável como "migração" no sentido de sistema em produção — é a criação inicial do projeto. Passos de setup:
1. Criar estrutura de diretórios e configs de workspace.
2. Subir Postgres+PostGIS e Redis via Docker Compose.
3. Rodar `prisma migrate dev` para criar o schema inicial.
4. Rodar o seed de categorias e municípios.
5. Validar que `backend` builda, expõe `/api/v1/health` e `/docs` (Swagger), e que `frontend` builda e roda a página inicial.

Rollback: como não há dados de produção envolvidos, rollback é apenas descartar a migration (`prisma migrate reset`) em ambiente de desenvolvimento.

## Open Questions

- Qual fonte de dados geográficos dos municípios do PR será usada no seed (IBGE via API, arquivo estático, etc.)? Decisão de implementação a ser tomada durante as tasks, sem impacto no schema.
- O projeto será inicializado como repositório git nesta change ou isso é uma decisão separada do usuário? (Assumindo que sim, como parte do setup inicial, já que é pré-requisito para qualquer versionamento das changes seguintes.)
