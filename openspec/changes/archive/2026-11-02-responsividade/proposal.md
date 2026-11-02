## Why

O frontend (`frontend`) está implementado e validado, mas é desktop-first — o layout atual (mapa + coluna lateral de 420px fixos) não cabe em telas de celular, e a página de detalhe tem uma grade de informações apertada em telas estreitas. Sem isso, boa parte do público-alvo (que acessa o mapa pelo celular) simplesmente não consegue usar o produto.

## What Changes

- `MapPage` ganha layout responsivo: abaixo de `lg` (1024px), mapa e lista deixam de ficar lado a lado e passam a alternar por abas ("Mapa" / "Lista"), abrindo em "Lista" por padrão.
- `FilterBar` fica colapsada atrás de um botão "Filtros" abaixo de `lg`, sempre visível em `lg+` como hoje.
- `OpportunityDetailPage`: grade de informações (faixa de valores, inscrições, municípios, número do edital) passa de `grid-cols-2` fixo para `grid-cols-1` abaixo de `sm` e `grid-cols-2` a partir de `sm`; cabeçalho (título + badge estadual) quebra linha graciosamente em vez de espremer.
- Nenhum componente é redesenhado do zero — tudo via classes responsivas do Tailwind (`sm:`, `lg:`) nos componentes já existentes.
- Validação real em pelo menos duas larguras de viewport (mobile ~390px, tablet ~768px), além de confirmar que o layout desktop (`lg+`, já validado em `frontend`) não regrediu.

## Capabilities

### New Capabilities
(nenhuma)

### Modified Capabilities
- `map-discovery-ui`: os requisitos de mapa interativo, filtros e página de detalhe passam a exigir comportamento responsivo (layout utilizável em telas pequenas), além do comportamento desktop já especificado.

## Impact

- Alterações em `MapPage`, `FilterBar`, `OpportunityDetailPage` (classes Tailwind responsivas, pequena lógica de estado local para a alternância de abas/colapso de filtros no mobile).
- Nenhuma alteração de backend, nenhuma migration, nenhuma dependência nova de produção.
- **Fora de escopo, deliberadamente**: otimização fina de touch-target além do que os componentes já oferecem, PWA/instalável, gestos customizados além do que o Leaflet já suporta nativamente.
