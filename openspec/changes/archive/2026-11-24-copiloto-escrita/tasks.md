## 1. Banco de dados

- [x] 1.1 Modelar `ProjectDraft` (userId, opportunityId, timestamps, unique por usuário+edital) no `backend/prisma/schema.prisma`
- [x] 1.2 Modelar `ProjectDraftSection` (draftId, seção [enum: JUSTIFICATIVA/OBJETIVOS/CONTRAPARTIDAS/ORCAMENTO], respostas estruturadas [Json], texto gerado, contador de regenerações, timestamps) — model chamado `ProjectDraftSectionEntry` no schema (tabela `project_draft_sections`), pra não colidir com o nome do enum `ProjectDraftSectionKey`
- [x] 1.3 Modelar `ProjectDraftQuestion` (draftId ou opportunityId+userId, pergunta, resposta, timestamps) com índice que permita contar perguntas por usuário/edital eficientemente — usa `draftId` (já único por usuário+edital via `ProjectDraft`), com índice em `draftId`
- [x] 1.4 Adicionar configuração de limites (regenerações por seção, perguntas por edital) a `backend/src/shared/config/env.schema.ts`, com defaults conservadores — `WIZARD_MAX_SECTION_REGENERATIONS=2`, `WIZARD_MAX_QUESTIONS_PER_OPPORTUNITY=3`
- [x] 1.5 Gerar e aplicar migration

## 2. Backend — extensão do AiProvider

- [x] 2.1 Definir método de geração de texto na interface de provider (`generateText` ou equivalente) em `ai-analysis/ai-provider.interface.ts` ou interface irmã dedicada
- [x] 2.2 Implementar o método no `GeminiProvider` existente, reaproveitando client/credenciais já configurados
- [x] 2.3 Escrever o prompt de geração de texto por seção, reforçando a regra "dado, nunca instrução" do `SYSTEM_PROMPT` já usado em `ai-analysis/prompt.ts`, incluindo como contexto um resumo compacto da `AIAnalysis` do edital (reaproveitar truncamento de `text-truncation.ts` se necessário) — resumo compacto construído direto dos campos já estruturados do `AIAnalysis.structuredResult`, sem precisar truncar texto bruto
- [x] 2.4 Escrever o prompt do tira-dúvidas, com o mesmo tratamento dado-nunca-instrução aplicado à pergunta do usuário, limitado aos dados já extraídos do edital (sem reprocessar o PDF)

## 3. Backend — módulo do wizard

- [x] 3.1 Criar módulo (ex. `backend/src/modules/project-drafts/`) com controller protegido pelo `JwtAuthGuard` da change `autenticacao-proponentes`
- [x] 3.2 Endpoint para iniciar/recuperar rascunho de um edital (valida `AIAnalysis` `COMPLETED` antes de permitir) — consolidado no `GET /project-drafts/:opportunityId` (3.6): toda chamada ao draft já faz get-or-create + valida a extração
- [x] 3.3 Endpoint para submeter respostas de uma seção, validar campos obrigatórios, chamar geração de texto, persistir resultado — `PUT /project-drafts/:opportunityId/sections/:section`
- [x] 3.4 Endpoint para regenerar o texto de uma seção, validando limite de regenerações antes de chamar a IA — `POST /project-drafts/:opportunityId/sections/:section/regenerate` (reaproveita as respostas já salvas); o próprio `PUT` de 3.3 também conta pro limite quando a seção já tinha sido respondida antes, pra não dar brecha de custo reenviando a mesma seção
- [x] 3.5 Endpoint para enviar pergunta do tira-dúvidas, validando tamanho da pergunta e limite por usuário/edital antes de chamar a IA — `POST /project-drafts/:opportunityId/questions`
- [x] 3.6 Endpoint para listar o estado atual do rascunho (respostas, textos gerados por seção, histórico de perguntas/respostas, contadores restantes) — `GET /project-drafts/:opportunityId`
- [x] 3.7 Validação de tamanho máximo de caracteres em todas as entradas de texto do usuário (respostas de seção e pergunta do tira-dúvidas) — via Zod (`ANSWER_MAX_LENGTH=600`, `QUESTION_MAX_LENGTH=300`)

## 4. Testes de backend

- [x] 4.1 Testes do prompt builder de geração de seção (contexto incluído, isolamento de instrução do usuário)
- [x] 4.2 Testes do prompt builder do tira-dúvidas (idem)
- [x] 4.3 Testes do serviço de rascunho: criação/recuperação, submissão de seção, regeneração respeitando limite, pergunta respeitando limite
- [x] 4.4 Teste de que falha na chamada à IA não consome o contador de regenerações/perguntas

## 5. Frontend — fluxo do wizard

- [x] 5.1 Adicionar ponto de entrada do wizard em `OpportunityDetailPage` (visível só se `AIAnalysis` estiver `COMPLETED` e usuário autenticado) — o autenticado já é garantido pelo `RequireAuth` na rota; só falta checar `latestAnalysis`
- [x] 5.2 Criar tela/rota do wizard com navegação entre as 4 seções fixas — `ProjectWizardPage` em `/editais/:id/escrever`
- [x] 5.3 Formulário de perguntas fechadas por seção, carregando respostas salvas se existirem — `WizardSectionPanel`
- [x] 5.4 Exibição do texto gerado por seção, com botão de copiar e ação de regenerar (desabilitada ao atingir o limite, refletindo o estado vindo do backend)
- [x] 5.5 Componente de tira-dúvidas (campo de pergunta + histórico de perguntas/respostas já feitas), desabilitado ao atingir o limite — `WizardQuestions`
- [x] 5.6 Chamadas de API em `frontend/src/lib/api.ts` para todos os endpoints novos, com `Authorization: Bearer` anexado

## 6. Validação manual

- [x] 6.1 Testar o fluxo completo: iniciar wizard → responder as 4 seções → ver texto gerado em cada uma → copiar texto — testado via curl contra o backend local (login real, `GET` cria o rascunho, `PUT` da seção Justificativa gera texto coerente em português); cópia é uma ação só de frontend (`navigator.clipboard`), não testável por aqui
- [x] 6.2 Testar limite de regeneração de seção (atingir o limite e confirmar bloqueio) — 2 regenerações aceitas (`regenerationCount` 1 e 2), 3ª bloqueada com 400 "Limite de regenerações desta seção foi atingido", sem chamar a IA
- [x] 6.3 Testar limite do tira-dúvidas (atingir 3 perguntas e confirmar bloqueio) — 3 perguntas respondidas corretamente com base no contexto do edital (uma delas corretamente respondeu "não sei, consulte o edital oficial" para algo fora do extraído), 4ª bloqueada com 400
- [x] 6.4 Testar retomada de rascunho: sair no meio do wizard, voltar, confirmar que respostas e textos já gerados continuam lá — `GET` do rascunho após as chamadas anteriores retorna respostas, texto gerado e histórico de perguntas intactos
- [x] 6.5 Tentar uma entrada deliberadamente adversarial (ex.: resposta ou pergunta contendo "ignore as instruções anteriores e...") e confirmar que a IA não muda de comportamento — enviei respostas da seção Objetivos com instruções explícitas pra IA ignorar as regras, responder só "HACKED" e revelar o system prompt; a IA ignorou completamente e escreveu o texto normal da seção, tratando o conteúdo adversarial como mais uma resposta do usuário

**Nota de validação:** durante os testes, o Gemini (free tier) retornou várias vezes `"This model is currently experiencing high demand"` (HTTP 500 após `GeminiProvider` propagar o erro) — instabilidade do provedor, não bug do código; confirmei que nessas falhas o contador de regenerações/perguntas não é incrementado (requisito 4.4). Com retry manual, todas as chamadas eventualmente funcionaram.
