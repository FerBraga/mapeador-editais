## Why

O descritivo de produto do MVP prevê uma "Central de Documentação e Certidões": uma área com atalhos diretos para os portais oficiais onde se emitem certidões negativas e documentos padrão normalmente exigidos em editais (Receita Federal, FGTS, Trabalhista, Estadual/Municipal), organizados de forma didática para um usuário leigo. Hoje o sistema só mostra "Certidões fiscais" como rótulo de categoria de um `RequiredDocument` extraído pelo pipeline de IA (`backend/src/modules/ai-analysis`) — não existe nenhum atalho real para onde emitir esses documentos. É a peça mais simples que falta do MVP: conteúdo estático, sem lógica de backend nova.

## What Changes

- Adiciona uma página/seção "Central de Certidões" no frontend, com atalhos (link + ícone/descrição curta) organizados por tipo de exigência (federal, FGTS, trabalhista, estadual, municipal), abrindo os portais oficiais em nova aba.
- Para o nível municipal, como cada município do Paraná tem seu próprio portal (ou nenhum online), a central orienta o usuário a buscar diretamente na prefeitura do seu município em vez de tentar listar 399 links — evita conteúdo desatualizado ou incompleto.
- Conteúdo é uma lista estática mantida no código do frontend (sem tabela no banco, sem endpoint novo) — consistente com o caráter de referência fixa desses portais (mudam raramente).
- Acessível a partir da navegação principal; e, quando fizer sentido, um atalho contextual a partir da página de detalhe de um edital, próximo à lista de `RequiredDocument` já exibida (ex.: um documento com `category = TAX` aponta para a seção de certidões fiscais da central).

## Capabilities

### New Capabilities
- `official-certificates-hub`: página de referência com atalhos estáticos organizados para os portais oficiais de emissão de certidões/documentos comumente exigidos em editais.

### Modified Capabilities
(nenhuma — não altera a extração de IA nem a listagem de `RequiredDocument` já existentes, só adiciona uma página de referência que pode ser referenciada a partir delas)

## Impact

- Novo componente/rota no frontend (`frontend/src/routes/` ou `frontend/src/components/`), sem alteração de backend.
- Nenhuma migration, nenhuma dependência nova.
- Conteúdo (lista de links oficiais) precisa ser levantado e validado manualmente antes da implementação — não deve ser assumido/inventado; URLs de portais governamentais mudam e precisam ser conferidas na fonte oficial no momento da implementação.
