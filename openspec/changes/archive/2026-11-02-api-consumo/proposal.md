## Why

As changes 1-6 capturaram, processaram e enriqueceram 539 editais reais (scraping, extração de documentos, análise por IA, geolocalização), mas nenhuma API pública expõe esses dados — os módulos `opportunities`, `categories` e `sources` continuam como stubs vazios desde a fundação do projeto. Esta change constrói a API de leitura/busca que o frontend (próxima change) vai consumir para renderizar o mapa e as buscas, fechando o elo entre o pipeline de dados já construído e a experiência de descoberta geográfica que é o objetivo central do produto.

## What Changes

- Implementa `GET /opportunities`: listagem paginada com filtros (município, categoria, fonte, status literal, faixa de valores, busca livre por texto) e um filtro best-effort `onlyOpen` computado a partir das datas de inscrição (já que o campo `status` está `UNKNOWN` em 100% dos 539 registros reais hoje — nenhum scraper o calcula ainda).
- Implementa `GET /opportunities/:id`: detalhe completo, incluindo município(s) vinculados (com lat/lon), `coversEntireState`, checklist de `RequiredDocument` e a `AIAnalysis` `COMPLETED` mais recente (sem merge entre múltiplas análises — mostra a mais recente).
- Implementa `GET /categories` e `GET /sources`: listagens simples para popular filtros da UI.
- Implementa `GET /municipalities`: listagem dos municípios do Paraná já seedados (id, nome, lat/lon, contagem de oportunidades vinculadas) — plumbing mínima necessária para o frontend desenhar qualquer pino no mapa; sem esse endpoint não há como exibir a funcionalidade geográfica central do produto.
- Primeiro uso real do `ZodValidationPipe` (já existente desde a fundação do projeto, nunca consumido) para validar query params de paginação/filtros.

## Capabilities

### New Capabilities
- `opportunities-read-api`: API HTTP de leitura/busca de oportunidades, categorias, fontes e municípios, com paginação, filtros geográficos/financeiros/temporais e busca textual, consumida pelo frontend do mapa.

### Modified Capabilities
(nenhuma — endpoints novos sobre capacidades já existentes, sem alterar requisitos documentados de scraping/documentos/IA/geolocalização)

## Impact

- Preenche os módulos stub `backend/src/modules/opportunities/`, `backend/src/modules/categories/`, `backend/src/modules/sources/`.
- Novo módulo `backend/src/modules/municipalities/` (hoje não existe nem como stub — municípios eram só consumidos internamente pelo matcher de geolocalização).
- Nenhuma migration necessária (somente leitura sobre tabelas já existentes).
- Nenhuma dependência nova de pacote.
