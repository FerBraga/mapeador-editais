## Context

`MapPage` hoje é `flex` horizontal fixo: mapa (`flex-1`) + coluna lateral `w-[420px]` (filtros + lista). Em uma tela de celular (~360-430px de largura), só a coluna lateral já estoura a viewport — o mapa fica totalmente inacessível. `OpportunityDetailPage` usa `grid-cols-2` fixo para o bloco de informações, que fica espremido abaixo de ~500px de largura. Nenhuma classe responsiva do Tailwind é usada em nenhum componente hoje. `index.html` já tem a meta viewport correta; Tailwind v4 com breakpoints padrão já está configurado.

## Goals / Non-Goals

**Goals:**
- Tornar o mapa, a lista, os filtros e o detalhe utilizáveis em telas de celular (~360-430px) e tablet (~768px), sem regredir o layout desktop já validado.
- Resolver isso só com classes responsivas do Tailwind sobre os componentes existentes, sem introduzir uma biblioteca de layout nova.

**Non-Goals:**
- Otimização fina de touch-target (tamanho de área clicável) além do que os componentes já têm.
- PWA/instalável, service worker, modo offline.
- Gestos customizados de mapa além do que o Leaflet já suporta nativamente (pinch-to-zoom, pan por toque já funcionam sem código adicional).
- Infraestrutura de testes automatizados — continua sendo escopo de `testes-homologacao`.

## Decisions

### Breakpoint único de corte: `lg` (1024px)
Abaixo de `lg`, o layout muda de "mapa+lista lado a lado" para "abas alternando entre mapa e lista". `lg` (1024px) foi escolhido porque a coluna lateral de 420px só faz sentido com pelo menos ~600px de mapa ao lado — abaixo disso a experiência lado a lado deixa de ser útil mesmo em tablets paisagem.

### Abas "Mapa" / "Lista" com estado local, abrindo em "Lista"
A alternância é um estado puramente de apresentação (`useState` local em `MapPage`), não sincronizado com a URL — diferente dos filtros, que continuam no `useSearchParams` (já eram compartilháveis antes desta change e continuam sendo, independente de qual aba está ativa). Abre em "Lista" por padrão no mobile: a lista é mais leve para a primeira renderização que os tiles do Leaflet, especialmente em conexão lenta.

### `FilterBar` colapsada por padrão abaixo de `lg`
Um botão "Filtros" expande/colapsa o conjunto de campos abaixo de `lg`; em `lg+` o comportamento atual (sempre visível) é mantido. Evita que o usuário mobile precise rolar por todos os campos de filtro antes de ver qualquer edital.

### Grade de informações do detalhe: `grid-cols-1` abaixo de `sm`, `grid-cols-2` a partir de `sm`
`sm` (640px) é suficiente para dois campos lado a lado sem espremer texto. Abaixo disso, cada campo ocupa a largura total.

### Sem redesenho de componentes
Todas as mudanças são classes Tailwind responsivas (`sm:`, `lg:`) aplicadas aos componentes já existentes (`MapPage`, `FilterBar`, `OpportunityDetailPage`); `OpportunityCard`, `OpportunityList` e os componentes de UI (`Button`, `Input`, `Select`, `Badge`) já são simples o suficiente para funcionar sem alteração.

## Risks / Trade-offs

- **[Trade-off] Mapa não visível por padrão no mobile (abre em "Lista")** → aceito deliberadamente por desempenho de primeira renderização; o usuário alterna para "Mapa" com um toque.
- **[Risco] Teste real em viewport pequeno pode revelar necessidade de ajustes finos não previstos aqui (ex.: truncamento de texto, overflow)** → serão corrigidos durante a própria validação real desta change, dentro do escopo (ajuste de CSS, não mudança de arquitetura).

## Migration Plan

Nenhuma — apenas mudanças de frontend, sem dados ou API afetados.
