## 1. MapPage: Abas Mapa/Lista em Telas Pequenas

- [x] 1.1 Adicionar estado local `view: 'map' | 'list'` em `MapPage`, default `'list'`
- [x] 1.2 Abaixo de `lg`: exibir botões/abas "Mapa" e "Lista" alternando qual painel é mostrado; acima de `lg`: layout atual lado a lado, sem abas visíveis
- [x] 1.3 Garantir que os filtros aplicados (via URL) permanecem os mesmos ao alternar de aba (estado em useSearchParams, independente da aba)

## 2. FilterBar Colapsável

- [x] 2.1 Adicionar estado local de expandido/colapsado em `FilterBar` (ou no componente pai), default colapsado abaixo de `lg`
- [x] 2.2 Botão "Filtros" expande/colapsa os campos abaixo de `lg`; acima de `lg`, filtros sempre visíveis (comportamento atual preservado)

## 3. OpportunityDetailPage Responsiva

- [x] 3.1 Grade de informações (`faixa de valores`, `inscrições`, `municípios`, `número do edital`): `grid-cols-1` abaixo de `sm`, `grid-cols-2` a partir de `sm`
- [x] 3.2 Cabeçalho (título + badge "Edital estadual"): permitir quebra de linha em telas estreitas em vez de espremer

## 4. Validação Real

- [x] 4.1 Instalar Playwright/Chromium temporariamente (mesma abordagem da change `frontend`)
- [x] 4.2 Rodar a aplicação real (API + frontend) e capturar screenshots em viewport mobile (~390px) e tablet (~768px): página inicial, alternância mapa/lista, filtros expandidos, página de detalhe
- [x] 4.3 Confirmar que o layout desktop (`lg+`) não regrediu, reaproveitando os mesmos cenários já validados em `frontend`
- [x] 4.4 Remover o Playwright do `package.json` ao final da validação
- [x] 4.5 Documentar os resultados observados

### Resultados da validação real (2026-11-02)

API + frontend reais (dados reais já enriquecidos pelo lote de IA/geolocalização rodado nesta sessão). Playwright/Chromium reinstalado temporariamente, removido ao final.

- **Mobile (390×844)**: abre em "Lista" por padrão, abas "Mapa"/"Lista" no cabeçalho, filtros colapsados atrás de "Mostrar filtros". Trocar para a aba "Mapa" renderiza o mapa corretamente em tela cheia (confirma que o `invalidateSize()` adicionado ao `MapView` resolve o problema conhecido de mapas Leaflet montados com container de tamanho zero atrás de uma aba inativa — sem ele, os tiles ficariam cortados/incompletos ao abrir a aba). Filtros expandidos empilham em coluna única. Detalhe de oportunidade: título quebra linha, badge "Edital estadual" abaixo, grade de informações em coluna única, lista de documentos exigidos já aparece deduplicada (2 itens, não 4 — confirma que o fix de deduplicação de documentos continua funcionando em conjunto com o layout responsivo).
- **Tablet (768×1024)**: mesmo comportamento de abas/filtros colapsáveis do mobile (abaixo do corte `lg`), lista legível em largura maior.
- **Desktop (1440×900, regressão)**: abas mobile confirmadas ausentes (`tabsVisible: false`), layout lado a lado (mapa + coluna de 420px) idêntico ao já validado na change `frontend`, sem diferença visual.
- Nenhum erro de página (`pageerror`) em nenhuma das três larguras testadas.
