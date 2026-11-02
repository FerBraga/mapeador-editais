## Why

A API de leitura/busca (`api-consumo`) já está pronta e validada contra os 539 editais reais, mas não há interface alguma para consumi-la — o frontend ainda é só uma página de placeholder verificando `/health`. Sem essa interface, todo o pipeline construído até aqui (scraping, documentos, IA, geolocalização, API) é invisível para o usuário final. Esta change constrói o mapa de descoberta de editais, a experiência central do produto.

## What Changes

- Instala `leaflet`/`react-leaflet` (tiles OpenStreetMap, sem API key, sem custo).
- Cria tipos TypeScript espelhando as respostas da API já implementada, e expande `src/lib/api.ts` com funções típadas para `opportunities`, `categories`, `sources`, `municipalities`.
- Cria hooks TanStack Query para cada recurso.
- Sincroniza o estado de filtros (município, categoria, fonte, `onlyOpen`, faixa de valores, busca livre, página) com os query params da URL, tornando buscas compartilháveis.
- Implementa `/` (`MapPage`): mapa com marcadores por município (raio proporcional à quantidade de editais vinculados, clique filtra a lista por esse município) + barra de filtros + lista paginada de oportunidades, lado a lado.
- Implementa `/editais/:id` (`OpportunityDetailPage`): todos os campos do edital, checklist de documentos exigidos, card de resumo gerado por IA com aviso explícito de que é conteúdo de IA (com link para o edital oficial), indicação de abrangência estadual, municípios vinculados.
- Estados de loading/erro/vazio em toda view que busca dados.
- Validação real rodando a aplicação no navegador (via skill `run` do projeto), não só revisão de código.

## Capabilities

### New Capabilities
- `map-discovery-ui`: interface web de descoberta geográfica de editais — mapa interativo, filtros sincronizados com URL, listagem paginada e página de detalhe, consumindo a API de leitura já existente.

### Modified Capabilities
(nenhuma — consome a API já existente sem alterar seus requisitos)

## Impact

- Novas dependências de frontend: `leaflet`, `react-leaflet`, `@types/leaflet`.
- Novos arquivos em `frontend/src/`: tipos, `lib/api.ts` expandido, `hooks/`, `components/` (mapa, filtros, cards, paginação), rotas `MapPage`/`OpportunityDetailPage`.
- `App.tsx` ganha a rota `/editais/:id`.
- Nenhuma alteração no backend (API já implementada e validada em `api-consumo`).
- **Fora de escopo, deliberadamente** (roadmap já estabelecido): responsividade/mobile (`responsividade`), infraestrutura de testes de frontend (`testes-homologacao`), autenticação/favoritos/alertas.
