## 1. Banco de dados

- [ ] 1.1 Modelar `ProjectDraft` (userId, opportunityId, timestamps, unique por usuário+edital) no `backend/prisma/schema.prisma`
- [ ] 1.2 Modelar `ProjectDraftSection` (draftId, seção [enum: JUSTIFICATIVA/OBJETIVOS/CONTRAPARTIDAS/ORCAMENTO], respostas estruturadas [Json], texto gerado, contador de regenerações, timestamps)
- [ ] 1.3 Modelar `ProjectDraftQuestion` (draftId ou opportunityId+userId, pergunta, resposta, timestamps) com índice que permita contar perguntas por usuário/edital eficientemente
- [ ] 1.4 Adicionar configuração de limites (regenerações por seção, perguntas por edital) a `backend/src/shared/config/env.schema.ts`, com defaults conservadores
- [ ] 1.5 Gerar e aplicar migration

## 2. Backend — extensão do AiProvider

- [ ] 2.1 Definir método de geração de texto na interface de provider (`generateText` ou equivalente) em `ai-analysis/ai-provider.interface.ts` ou interface irmã dedicada
- [ ] 2.2 Implementar o método no `GeminiProvider` existente, reaproveitando client/credenciais já configurados
- [ ] 2.3 Escrever o prompt de geração de texto por seção, reforçando a regra "dado, nunca instrução" do `SYSTEM_PROMPT` já usado em `ai-analysis/prompt.ts`, incluindo como contexto um resumo compacto da `AIAnalysis` do edital (reaproveitar truncamento de `text-truncation.ts` se necessário)
- [ ] 2.4 Escrever o prompt do tira-dúvidas, com o mesmo tratamento dado-nunca-instrução aplicado à pergunta do usuário, limitado aos dados já extraídos do edital (sem reprocessar o PDF)

## 3. Backend — módulo do wizard

- [ ] 3.1 Criar módulo (ex. `backend/src/modules/project-drafts/`) com controller protegido pelo `JwtAuthGuard` da change `autenticacao-proponentes`
- [ ] 3.2 Endpoint para iniciar/recuperar rascunho de um edital (valida `AIAnalysis` `COMPLETED` antes de permitir)
- [ ] 3.3 Endpoint para submeter respostas de uma seção, validar campos obrigatórios, chamar geração de texto, persistir resultado
- [ ] 3.4 Endpoint para regenerar o texto de uma seção, validando limite de regenerações antes de chamar a IA
- [ ] 3.5 Endpoint para enviar pergunta do tira-dúvidas, validando tamanho da pergunta e limite por usuário/edital antes de chamar a IA
- [ ] 3.6 Endpoint para listar o estado atual do rascunho (respostas, textos gerados por seção, histórico de perguntas/respostas, contadores restantes)
- [ ] 3.7 Validação de tamanho máximo de caracteres em todas as entradas de texto do usuário (respostas de seção e pergunta do tira-dúvidas)

## 4. Testes de backend

- [ ] 4.1 Testes do prompt builder de geração de seção (contexto incluído, isolamento de instrução do usuário)
- [ ] 4.2 Testes do prompt builder do tira-dúvidas (idem)
- [ ] 4.3 Testes do serviço de rascunho: criação/recuperação, submissão de seção, regeneração respeitando limite, pergunta respeitando limite
- [ ] 4.4 Teste de que falha na chamada à IA não consome o contador de regenerações/perguntas

## 5. Frontend — fluxo do wizard

- [ ] 5.1 Adicionar ponto de entrada do wizard em `OpportunityDetailPage` (visível só se `AIAnalysis` estiver `COMPLETED` e usuário autenticado)
- [ ] 5.2 Criar tela/rota do wizard com navegação entre as 4 seções fixas
- [ ] 5.3 Formulário de perguntas fechadas por seção, carregando respostas salvas se existirem
- [ ] 5.4 Exibição do texto gerado por seção, com botão de copiar e ação de regenerar (desabilitada ao atingir o limite, refletindo o estado vindo do backend)
- [ ] 5.5 Componente de tira-dúvidas (campo de pergunta + histórico de perguntas/respostas já feitas), desabilitado ao atingir o limite
- [ ] 5.6 Chamadas de API em `frontend/src/lib/api.ts` para todos os endpoints novos, com `Authorization: Bearer` anexado

## 6. Validação manual

- [ ] 6.1 Testar o fluxo completo: iniciar wizard → responder as 4 seções → ver texto gerado em cada uma → copiar texto
- [ ] 6.2 Testar limite de regeneração de seção (atingir o limite e confirmar bloqueio)
- [ ] 6.3 Testar limite do tira-dúvidas (atingir 3 perguntas e confirmar bloqueio)
- [ ] 6.4 Testar retomada de rascunho: sair no meio do wizard, voltar, confirmar que respostas e textos já gerados continuam lá
- [ ] 6.5 Tentar uma entrada deliberadamente adversarial (ex.: resposta ou pergunta contendo "ignore as instruções anteriores e...") e confirmar que a IA não muda de comportamento
