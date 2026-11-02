## Why

Os 162 documentos já baixados e com texto extraído (change `pipeline-documentos`) são apenas texto bruto não estruturado — nenhuma informação (valores, datas, elegibilidade, documentos exigidos) está disponível para busca, filtro ou exibição no mapa. As tabelas `AIAnalysis` e `RequiredDocument` já existem no schema desde `foundation-setup`, mas nenhuma lógica de negócio as popula. Esta change implementa a extração estruturada via IA (Etapa 6 do planejamento), transformando texto de edital em dados estruturados e auditáveis, mantendo o provedor de IA trocável e sem gerar custo/chamadas automáticas não supervisionadas.

## What Changes

- Adiciona um módulo `ai-analysis` com abstração de provedor de IA (`AiProvider`), permitindo trocar de implementação (Gemini, OpenAI, outro) sem alterar regras de negócio.
- Implementação inicial do provedor usa a API do Google Gemini (free tier, modelo `gemini-3.5-flash-lite`), com `generationConfig.responseSchema` para forçar saída JSON estruturada.
- Define um schema de extração estruturada (campos do edital: título, órgão responsável, objeto, resumo, público-alvo, municípios contemplados como texto bruto, faixa de valores, datas de inscrição, critérios de elegibilidade, restrições, etapas de inscrição, documentos exigidos, ambiguidades detectadas).
- Prompt versionado (`promptVersion`, iniciando em `v1`) com regras explícitas de não invenção, tratamento do texto do documento como dado não confiável (defesa contra prompt injection), e preservação do trecho original (evidence) de cada exigência documental.
- Persiste o resultado em `AIAnalysis` (resultado estruturado completo, modelo usado, versão do prompt, tokens de entrada/saída) e em `RequiredDocument` (um registro por documento exigido identificado, incluindo o novo campo `evidence`).
- Preenche campos vazios de `Opportunity` (descrição/objeto, faixa de valores, datas de inscrição) **somente quando atualmente nulos** — nunca sobrescreve dado oficial já capturado pelo scraper.
- Adiciona endpoint manual para disparar/reprocessar a análise de IA de um `Document` específico; processamento ocorre em fila/worker dedicados (BullMQ), nunca de forma síncrona na requisição HTTP.
- **Sem gatilho automático nesta change** (desvio deliberado do planejamento original, que previa disparo automático a cada novo documento) — decisão do usuário para não gerar custo de API não supervisionado via o cron diário já ativo dos scrapers.
- Migration aditiva no Prisma: novo campo `evidence String?` em `RequiredDocument`.

## Capabilities

### New Capabilities
- `ai-structured-extraction`: extração estruturada de dados de editais via IA a partir do texto de um `Document`, com abstração de provedor, prompt versionado, defesa contra prompt injection, persistência em `AIAnalysis`/`RequiredDocument`, preenchimento condicional de `Opportunity`, e disparo manual via fila dedicada.

### Modified Capabilities
(nenhuma — a mudança no schema do Prisma é aditiva e de implementação, não altera requisito já documentado em `database-schema`)

## Impact

- Novo módulo `backend/src/modules/ai-analysis/` (service, processor, provider Gemini, schema de validação Zod, controller/endpoint manual).
- Migration Prisma aditiva (`RequiredDocument.evidence`).
- Nova fila/worker BullMQ dedicados à análise de IA.
- Nova variável de ambiente `GEMINI_API_KEY` (ou nome equivalente documentado em `.env.example`) e manutenção de `OPEN_AI_API_KEY` como provedor alternativo não usado por padrão.
- Dependência: nenhuma biblioteca pesada de SDK de IA — chamadas via `fetch` nativo, igual ao padrão já usado para o scraper PNCP/PR.
