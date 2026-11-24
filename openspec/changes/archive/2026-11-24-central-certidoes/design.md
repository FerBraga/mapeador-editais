## Context

A página de detalhe de edital (`OpportunityDetailPage`) já exibe a lista de `RequiredDocument` extraída pela IA, cada um com uma `category` (`LEGAL`, `TAX`, `FINANCIAL`, `TECHNICAL`, `DECLARATION`, `OTHER`) rotulada na UI (ex.: `TAX` → "Certidões fiscais"). Não existe hoje nenhum link de onde o usuário realmente emite esses documentos. Esta change é deliberadamente simples: conteúdo de referência estático, sem modelo de dados novo.

## Goals / Non-Goals

**Goals:**
- Dar ao usuário leigo um ponto único e organizado de atalhos para os portais oficiais mais comuns exigidos em editais.
- Conectar, quando fizer sentido, a categoria de um `RequiredDocument` já exibido ao atalho correspondente na central.

**Non-Goals:**
- Automatizar a emissão ou verificação de qualquer certidão — é só um diretório de links, o usuário emite manualmente fora da plataforma.
- Cobrir os links específicos de todas as prefeituras do Paraná — inviável de manter atualizado para 399 municípios; a central orienta a busca em vez de linkar cada uma.
- Qualquer conteúdo dinâmico ou editável por admin nesta change (sem painel administrativo no MVP) — lista fixa no código.

## Decisions

**Conteúdo como constante estática no frontend, não como dado no banco.** Portais oficiais de certidão mudam raramente (anos, não semanas), e o MVP não tem painel administrativo para editar esse tipo de conteúdo. Uma constante no código (ex. `frontend/src/lib/certificates.ts`) é a solução mais simples que atende o requisito, evitando uma tabela e endpoints novos só para meia dúzia de links fixos. Se um dia isso precisar ser editável por um administrador, migrar de constante para tabela é uma mudança isolada e pequena.

**Nível municipal como orientação textual, não lista de 399 links.** Manter 399 links de prefeituras diferentes (muitas sem portal online, URLs que mudam, alguns municípios pequenos sem certidão digitalizada) seria trabalho desproporcional ao MVP e geraria uma fonte constante de links quebrados. A central orienta: "busque a Secretaria de Fazenda/Finanças da prefeitura do seu município" — honesto sobre a limitação em vez de fingir cobertura completa.

**Atalho contextual na página do edital é opcional/incremental, não bloqueante.** A central funciona como página independente primeiro; a ligação com `RequiredDocument.category` (ex.: documento `TAX` linkando direto pra seção fiscal da central) é um incremento de UX que pode ser feito na mesma change ou adiado sem impacto se o tempo apertar — está refletido como tarefa separada, não como pré-requisito das outras.

## Risks / Trade-offs

- [URLs de portais governamentais podem ficar desatualizadas/quebradas com o tempo] → Mitigação: lista pequena e centralizada (um único arquivo), fácil de corrigir num PR pontual quando notado; não há automação de verificação de link morto no MVP.
- [Lista de categorias (federal/FGTS/trabalhista/estadual) pode não cobrir toda exigência documental real de um edital específico] → Mitigação: aceito; é uma central de referência genérica, não uma cobertura garantida de 100% dos documentos possíveis — o objetivo é cobrir os casos mais comuns.

## Migration Plan

Não aplicável — mudança puramente de frontend, aditiva, sem schema, sem dados a migrar. Deploy é só a nova build do frontend.
