## Context

O backend expõe uma API de leitura/busca completa (`GET /opportunities` com filtros e paginação, `GET /opportunities/:id`, `GET /categories`, `GET /sources`, `GET /municipalities`), validada contra 539 editais reais. O frontend hoje é um scaffold mínimo (React 19, Vite 8, TanStack Query v5, react-router-dom v7, Tailwind v4, shadcn "base-nova") com uma única página de placeholder e um único componente (`Button`). Decisão já tomada nesta sessão: mapa via Leaflet + OpenStreetMap (gratuito, sem API key).

## Goals / Non-Goals

**Goals:**
- Tornar visível e navegável, pela primeira vez, todo o pipeline de dados já construído (scraping → documentos → IA → geolocalização → API).
- Mapa com marcadores por município, proporcional à quantidade de editais vinculados, interativo (clique filtra a lista).
- Filtros e paginação refletidos na URL (buscas compartilháveis/voltáveis pelo histórico do navegador).
- Página de detalhe transparente sobre a origem dos dados gerados por IA (nunca apresentar resumo/checklist de IA como se fosse garantidamente oficial).
- Estados de loading/erro/vazio tratados em toda tela que depende de dados remotos.

**Non-Goals:**
- Responsividade/layout mobile — desktop-first nesta change; `responsividade` é a próxima change do roadmap.
- Infraestrutura de testes de frontend (unitário, componente, e2e) — fica para `testes-homologacao`; validação aqui é manual, rodando a aplicação real.
- Autenticação, favoritos, alertas — a API não tem esses endpoints (decisão de escopo já tomada em `api-consumo`).
- Visualização dedicada "só editais estaduais" — a API não tem esse filtro; toda busca por município já traz os estaduais, o que é aceito como suficiente para o MVP.
- Geração de tipos TypeScript a partir do OpenAPI/Swagger já exposto pelo backend — tipos são escritos à mão, espelhando exatamente o contrato já conhecido; mais simples para o volume atual de endpoints.
- Clustering avançado de marcadores, mapas de calor, animações — marcadores circulares simples (proporcionais) são suficientes para 399 municípios.

## Decisions

### Leaflet + OpenStreetMap, sem API key
`react-leaflet` sobre tiles públicos do OpenStreetMap. Zero custo, zero cadastro, consistente com a postura do projeto de priorizar opções gratuitas sempre que o MVP permitir (mesma lógica aplicada à escolha do Gemini free tier em `integracao-ia`). Alternativa considerada: MapLibre GL (mapas vetoriais) — rejeitada por exigir um provedor de estilo com cadastro/API key (ex.: MapTiler) para ganho visual não essencial neste estágio.

### Filtros sincronizados com a URL via `useSearchParams`
Cada filtro (município, categoria, fonte, `onlyOpen`, `fundingMin`/`fundingMax`, `q`, página) é lido/escrito nos query params da URL, não em estado React isolado. Isso torna toda busca compartilhável por link e navegável pelo histórico do navegador (voltar/avançar), sem necessidade de um gerenciador de estado global.

### Tipos TypeScript escritos à mão, espelhando o contrato já conhecido
A forma exata de cada resposta já foi fixada e validada em `api-consumo`. Escrever os tipos manualmente é mais simples que configurar geração via OpenAPI para o volume atual (5 endpoints), e mantém o frontend simples de entender sem uma etapa de build adicional.

### Marcadores proporcionais no mapa, sem clustering
Cada um dos 399 municípios é um marcador circular (`CircleMarker`) cujo raio cresce com `opportunityCount`; municípios sem oportunidades aparecem como um ponto mínimo (contexto geográfico, não escondidos). Clicar em um marcador define `municipalityId` no filtro da URL, atualizando a lista. Clustering/heatmap são deixados de fora: a quantidade de municípios (399) é pequena o suficiente para não precisar dessa complexidade.

### Transparência sobre conteúdo gerado por IA
O card de resumo de IA na página de detalhe SHALL exibir um aviso explícito (ex.: "Resumo gerado por IA — pode conter imprecisões; consulte o edital oficial") com link direto para `officialUrl`. Esse é um princípio já aplicado consistentemente desde `integracao-ia` (nunca inventar, sempre permitir verificação) — a interface precisa preservar essa transparência, não apresentar o resultado da IA como se fosse garantidamente correto.

### Sem visualização dedicada de "editais estaduais"
Como a API não oferece um filtro `coversEntireState` isolado, e todo filtro por município já inclui os editais estaduais automaticamente, o MVP não constrói uma tela/filtro dedicado só para eles — apenas um badge "Edital estadual" nos cards/detalhe quando `coversEntireState = true`, para que o usuário entenda por que aquele edital apareceu na busca por um município específico sem estar diretamente vinculado a ele.

### Paginação simples (anterior/próxima), sem scroll infinito
Suficiente para o volume atual (539 registros, ~27 páginas de 20). Scroll infinito adicionaria complexidade de estado sem benefício claro neste estágio.

### Validação via skill `run` do projeto
Ao final da implementação, a aplicação SHALL ser rodada de fato (API + frontend) e a experiência validada visualmente/interativamente no navegador — não apenas revisão de código —, usando o skill `run` já disponível neste projeto para esse fim.

## Risks / Trade-offs

- **[Risco] Tiles do OpenStreetMap têm política de uso justo (rate limit informal para produção)** → Aceitável para desenvolvimento/MVP; se o tráfego crescer, trocar para um provedor de tiles dedicado é uma mudança isolada no componente de mapa, não estrutural.
- **[Trade-off] Tipos manuais podem divergir da API se o backend mudar sem avisar** → Aceito; os dois lados estão no mesmo monorepo e sob controle da mesma equipe nesta fase do projeto.
- **[Trade-off] Sem testes automatizados nesta change** → Deliberado, documentado como Non-Goal; `testes-homologacao` cobre isso explicitamente depois.
- **[Risco] UX não otimizada para mobile até a próxima change** → Aceito como sequenciamento deliberado do roadmap; não é um problema de qualidade, é uma decisão de ordem de entrega.

## Migration Plan

Nenhuma migration de backend. No frontend, apenas adição de dependências e arquivos novos; nenhum dado existente é afetado.
