## 1. Dependências e Tipos

- [x] 1.1 Instalar `leaflet`, `react-leaflet`, `@types/leaflet`; importar o CSS do Leaflet
- [x] 1.2 Criar `src/types/api.ts` com os tipos espelhando as respostas da API (`OpportunitySummary`, `OpportunityDetail`, `Category`, `Source`, `Municipality`, `PaginationMeta`, `ApiErrorResponse`)
- [x] 1.3 Expandir `src/lib/api.ts` com funções típadas: `fetchOpportunities(filters)`, `fetchOpportunity(id)`, `fetchCategories()`, `fetchSources()`, `fetchMunicipalities()`, tratando erros 400/404 de forma distinguível

## 2. Hooks e Estado de Filtros

- [x] 2.1 Criar hooks TanStack Query em `src/hooks/`: `useOpportunities(filters)`, `useOpportunity(id)`, `useCategories()`, `useSources()`, `useMunicipalities()`
- [x] 2.2 Criar helper de filtros sincronizados com `useSearchParams` (parse/serialize de município, categoria, fonte, onlyOpen, fundingMin/fundingMax, q, page)

## 3. Mapa

- [x] 3.1 Criar componente `MapView` (Leaflet + tiles OpenStreetMap) renderizando um `CircleMarker` por município, raio proporcional a `opportunityCount`
- [x] 3.2 Clique em um marcador atualiza o filtro `municipalityId` na URL
- [x] 3.3 Município selecionado tem destaque visual distinto no mapa

## 4. Filtros e Listagem

- [x] 4.1 Criar componente `FilterBar` (select de categoria, select de fonte, toggle `onlyOpen`, inputs de faixa de valor, input de busca livre), populado via `useCategories`/`useSources`
- [x] 4.2 Criar componente `OpportunityCard` (título, organização, faixa de valores, prazo, badge de categoria, badge "Edital estadual" quando aplicável)
- [x] 4.3 Criar componente `OpportunityList` com estados de loading/erro/vazio e paginação (anterior/próxima, página X de Y)
- [x] 4.4 Montar `MapPage` (`/`) combinando `MapView` + `FilterBar` + `OpportunityList`, lado a lado (desktop-first)

## 5. Página de Detalhe

- [x] 5.1 Criar `OpportunityDetailPage` (`/editais/:id`): cabeçalho (título, organização, link oficial, badge estadual), descrição/objeto, faixa de valores e datas, municípios vinculados
- [x] 5.2 Seção de checklist de documentos exigidos (nome, categoria, obrigatório/recomendado, não exibir campo de evidência cru na UI principal — manter simples)
- [x] 5.3 Card de resumo de IA (quando `latestAnalysis` existir) com aviso explícito de conteúdo gerado por IA e link para a fonte oficial; omitido quando não houver análise
- [x] 5.4 Tratar estados de loading/erro/404 (oportunidade inexistente)
- [x] 5.5 Adicionar rota `/editais/:id` em `App.tsx`

## 6. Validação Real

- [x] 6.1 Rodar a aplicação real (API + frontend) usando o skill `run` do projeto
- [x] 6.2 Validar no navegador: carregamento do mapa com os 399 municípios e contagens reais, clique em município filtrando a lista, busca livre, filtro `onlyOpen`, paginação
- [x] 6.3 Validar a página de detalhe de uma oportunidade real com análise de IA e documentos exigidos, e de uma sem análise
- [x] 6.4 Validar estado de erro (API fora do ar) e estado vazio (filtro sem resultados)
- [x] 6.5 Documentar os resultados observados

### Resultados da validação real (2026-11-02)

Nenhum skill de `run` específico do projeto existia ainda (primeira vez usando o skill `run` neste projeto). Seguido o fallback "browser-driven": backend real (`node dist/src/main`) + frontend real (`vite`) + Playwright/Chromium instalado temporariamente para dirigir um navegador headless real e capturar screenshots — removido do `package.json` ao final (infraestrutura de testes de verdade fica para `testes-homologacao`, não fazia parte do escopo desta change).

Validado com screenshots reais contra a API com os 539 editais reais:
- Mapa inicial: 399 marcadores renderizados, cluster visivelmente maior em torno de Curitiba, lista com os 539 editais reais, badge "Estadual" visível em "Acolhida a Ucranianos" com valor real (R$ 18.000.000,00).
- Busca livre por "Mobilidade" → card real → clique → `/editais/:id` com todos os campos reais: badge "Edital estadual", "Todo o estado do Paraná", 4 documentos exigidos reais (obrigatório/recomendado corretos), card "Resumo gerado por IA" com o aviso de transparência e link para a fonte oficial.
- Clique em marcador de município sem oportunidades diretas (Abatiá) → lista filtrada corretamente para as 3 oportunidades estaduais (confirma em UI real o comportamento OR já validado via API em `api-consumo`) + botão "Limpar município: Abatiá" funcionando.
- Paginação: `?page=2` navega e carrega outra página real de resultados.
- Estado vazio: busca sem resultados exibe "Nenhum edital encontrado para esses filtros."
- Estado 404: oportunidade inexistente exibe "Edital não encontrado." com link de volta ao mapa.

**Achado real corrigido durante a validação**: a página de detalhe de uma oportunidade inexistente ficava presa em "Carregando edital..." por ~7s antes de mostrar o erro 404, porque o TanStack Query tentava novamente (retry padrão com backoff) mesmo para um erro 404 que nunca teria sucesso em uma nova tentativa. Corrigido adicionando `shouldRetryQuery` em `lib/api.ts` (não tenta de novo para erros 4xx, só para falhas de rede/5xx), aplicado a todos os hooks de busca. Após a correção, o erro 404 aparece quase instantaneamente — confirmado com nova captura de tela.
