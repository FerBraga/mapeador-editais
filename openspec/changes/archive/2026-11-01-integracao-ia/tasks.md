## 1. Schema e Migration

- [x] 1.1 Adicionar campo `evidence String?` ao model `RequiredDocument` no `schema.prisma`
- [x] 1.2 Gerar e aplicar migration aditiva (`prisma migrate dev`)
- [x] 1.3 Atualizar `backend/.env.example` com `GEMINI_API_KEY` (ou confirmar `GOOGLE_AI_API_KEY`), `AI_PROVIDER`, `AI_MODEL`, `AI_MAX_INPUT_CHARS`, com comentários explicativos
- [x] 1.4 Adicionar validação dessas env vars na config Zod existente

## 2. Schema de Extração e Abstração de Provedor

- [x] 2.1 Criar módulo `backend/src/modules/ai-analysis/`
- [x] 2.2 Definir `OpportunityExtractionSchema` (Zod) com todos os campos descritos no design (título, órgão, objeto, resumo, público-alvo, municípios, valores, datas, elegibilidade, restrições, etapas, documentosExigidos, ambiguidades)
- [x] 2.3 Definir interface `AiProvider` (`extract(text: string): Promise<{ raw: unknown; tokensInput: number; tokensOutput: number; model: string }>`)
- [x] 2.4 Implementar `GeminiProvider` usando `fetch` contra a API do Gemini, com `responseMimeType: application/json` + `responseSchema` (JSON Schema equivalente ao Zod), lendo `GEMINI_API_KEY`/`AI_MODEL` da config
- [x] 2.5 Implementar prompt de sistema versionado (`PROMPT_VERSION = "v1"`) com regras de não invenção, tratamento do texto como dado não confiável, e preservação de evidência textual
- [x] 2.6 Implementar truncamento do texto de entrada conforme `AI_MAX_INPUT_CHARS`

## 3. Serviço de Análise e Persistência

- [x] 3.1 Implementar `AiAnalysisService.analyzeDocument(documentId)`: busca o `Document`, valida que há `extractedText`, chama o `AiProvider`, valida a resposta com Zod
- [x] 3.2 Em caso de validação bem-sucedida: criar registro `AIAnalysis` (resultado estruturado, model, promptVersion, tokensInput, tokensOutput)
- [x] 3.3 Criar um `RequiredDocument` para cada item de `documentosExigidos`, incluindo `evidence` e página aproximada
- [x] 3.4 Implementar preenchimento condicional da `Opportunity` associada (description/object, fundingMin, fundingMax, registrationStartAt, registrationEndAt) somente quando o campo atual for nulo
- [x] 3.5 Em caso de falha de validação/erro do provedor: registrar a falha de forma explícita (status FAILED + errorMessage), sem criar `AIAnalysis` com dado inválido como se fosse válido, nem `RequiredDocument` parciais
- [x] 3.6 Garantir que múltiplas análises do mesmo documento não sobrescrevem/deduplicam registros anteriores (sempre cria novo registro)

## 4. Fila, Worker e Endpoint Manual

- [x] 4.1 Criar fila BullMQ dedicada `ai-analysis` e `AiAnalysisProcessor`
- [x] 4.2 Criar módulo de worker dedicado (mesmo padrão de `documents`/`scrapers`), consumindo a fila separadamente da API
- [x] 4.3 Adicionar endpoint `POST /ai-analysis/documents/:documentId` que valida existência de `extractedText` e enfileira o job, retornando 202 imediatamente
- [x] 4.4 Rejeitar (erro claro) a chamada do endpoint para documentos sem `extractedText` (needsOcr ou não-PDF)

## 5. Testes

- [x] 5.1 Testes unitários do `AiAnalysisService` com `AiProvider` mockado (sucesso, falha de validação, preenchimento condicional de Opportunity, documento sem texto)
- [x] 5.2 Teste unitário do truncamento de texto de entrada
- [x] 5.3 Teste unitário garantindo que campos já preenchidos da `Opportunity` nunca são sobrescritos

## 6. Validação Real

- [x] 6.1 Rodar a análise manual contra uma AMOSTRA PEQUENA e deliberada de documentos reais já no banco (não todos os 162 — poucas chamadas reais à API do Gemini, para validar o fluxo completo de ponta a ponta sem gerar uso desnecessário)
- [x] 6.2 Confirmar que `AIAnalysis` e `RequiredDocument` são persistidos corretamente para esses documentos
- [x] 6.3 Confirmar que campos de `Opportunity` previamente nulos foram preenchidos, e nenhum campo já preenchido foi alterado
- [x] 6.4 Documentar nos resultados desta tarefa os tokens consumidos e a qualidade observada da extração

### Resultados da validação real (2026-11-01/02)

API (`npm run start:dev`) e worker dedicado (`npm run worker:ai-analysis`) executados localmente contra o Postgres/Redis reais via Docker Compose. 3 chamadas reais à API do Gemini (`gemini-3.5-flash-lite`, free tier) foram feitas, via `POST /api/v1/ai-analysis/documents/:documentId`:

1. **Documento "CP 10/2022: Edital" (Fundação Araucária)** — 1ª análise: `COMPLETED`, 6709 tokens de entrada / 1582 de saída. Extraiu título, órgão, objeto, resumo, 6 critérios de elegibilidade, 2 restrições, 4 etapas de inscrição e 8 documentos exigidos com evidência textual e página aproximada. `fundingMax` (888000) e `registrationStartAt` (2022-04-28) corretamente identificados e persistidos na `Opportunity` (antes nulos); `fundingMin` corretamente retornado como `null` (não presente no texto).
2. **Documento "EDITAL MOBILIDADE CULTURAL" (Cultura PR)** — 1ª análise: `COMPLETED`, 7289/894 tokens. 6 documentos exigidos extraídos, `description`/`object` da `Opportunity` preenchidos (antes nulos).
3. **Reprocessamento manual do mesmo documento de Mobilidade Cultural** — 2ª análise para o mesmo `Document`: `COMPLETED` novamente, criando um segundo registro `AIAnalysis` (histórico preservado, nenhuma deduplicação) e 4 novos `RequiredDocument` (sem deduplicação entre análises, como especificado). Confirmado que `description`/`object`/`fundingMin`/`fundingMax` da `Opportunity` **não foram alterados** na segunda passada (regra de preenchimento condicional validada em runtime real, não só em teste unitário).

Total: 14 `RequiredDocument` criados na 1ª rodada (8 + 6), mais 4 na 2ª rodada de reprocessamento. Qualidade da extração: alta — nenhuma invenção observada, evidências textuais fiéis ao documento original, distinção correta entre documentos obrigatórios e facultativos (ex.: "Termo de Anuência da ICTPR privada" corretamente marcado como não obrigatório quando o texto indicava alternância com outro anexo).
