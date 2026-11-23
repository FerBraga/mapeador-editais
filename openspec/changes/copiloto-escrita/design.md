## Context

O módulo `ai-analysis` já extrai, de forma estruturada, os dados de um edital (`OpportunityExtractionSchema`: objeto, público-alvo, critérios de elegibilidade, restrições, documentos exigidos etc.) a partir do PDF, usando um provider de IA (`AiProvider.extract()`, implementado hoje só para Gemini) e um prompt (`ai-analysis/prompt.ts`) que já trata o texto do edital como **dado, nunca instrução** — regra explícita no `SYSTEM_PROMPT` existente contra prompt injection.

Esta change reaproveita essa extração já feita (`AIAnalysis` com `status: COMPLETED`) como contexto para duas funcionalidades novas, ambas geração de texto (não mais extração): (1) redigir o texto de cada seção do projeto do proponente a partir de respostas objetivas, e (2) responder perguntas pontuais sobre o edital. Depende da change `autenticacao-proponentes` para saber de quem é o rascunho.

## Goals / Non-Goals

**Goals:**
- Fluxo de wizard por seção, com perguntas fechadas/objetivas definidas pelo sistema (não um chat), gerando o texto de cada seção via IA.
- Tira-dúvidas pontual sobre o edital, estritamente limitado em quantidade por usuário/edital.
- Persistir rascunho (respostas + textos gerados) por usuário e por edital, recuperável entre sessões.
- Tratar toda entrada do usuário (respostas estruturadas e, principalmente, a pergunta livre do tira-dúvidas) como dado nunca-instrução no prompt, seguindo e reforçando o padrão já estabelecido em `ai-analysis/prompt.ts`.
- Limitar o volume de chamadas à IA por usuário (regenerações de seção + perguntas do tira-dúvidas) para controlar custo e abuso.

**Non-Goals:**
- Chat livre/aberto em qualquer parte do fluxo — toda interação é de formato fechado (formulário) ou de volume estritamente limitado (tira-dúvidas).
- Upload de edital avulso fora da base.
- Exportação formatada do projeto final (PDF/docx).
- Qualquer tentativa de validar se o projeto gerado "vai ser aprovado" no edital — a IA redige com base no que foi informado, a responsabilidade pelo conteúdo final é do usuário.

## Decisions

**Perguntas de cada seção são fixas no código (não geradas dinamicamente pela IA por edital).** Gerar as perguntas dinamicamente por edital adicionaria uma chamada de IA extra por seção e, mais importante, abriria uma superfície onde o texto do edital influenciaria o que é perguntado ao usuário — mais uma via indireta de prompt injection. Um conjunto fixo de perguntas por seção (justificativa, objetivos, contrapartidas, orçamento básico), igual para todos os editais, é mais previsível, mais barato, e suficiente para o objetivo do MVP. As respostas do usuário + o contexto extraído do edital (que já passa pela mesma extração protegida) são o que efetivamente personaliza o texto gerado.

**Geração de texto por seção é uma chamada de IA independente, sem memória de conversa entre seções.** Cada chamada recebe: as respostas da seção atual + um resumo compacto do que já foi extraído do edital (não o PDF inteiro de novo). Isso mantém o prompt pequeno e previsível (reaproveita o padrão de truncamento já usado em `ai-analysis/text-truncation.ts`) e evita que o estado cresça indefinidamente numa "conversa".

**Tira-dúvidas: contexto estritamente limitado aos dados já extraídos do edital, nunca ao PDF bruto de novo.** A pergunta do usuário (único texto livre do fluxo) entra no prompt já marcada como DADO sob as mesmas regras do `SYSTEM_PROMPT` de extração (ignorar qualquer instrução embutida na pergunta), e a IA só tem acesso ao resumo estruturado do edital — isso reduz a superfície de ataque comparado a reprocessar o PDF original a cada pergunta.

**Limite de uso contado e aplicado no backend, não só na UI.** Tanto o limite de perguntas do tira-dúvidas (ex.: 3 por usuário/edital) quanto o de regenerações por seção são verificados no backend antes de cada chamada à IA — nunca confiar só em desabilitar botão no frontend. Contadores ficam em tabelas próprias (não em memória), para sobreviver a reinícios do processo e funcionar igual entre múltiplas abas/dispositivos do mesmo usuário.

**Extensão do `AiProvider` com um método de geração, mantendo `extract()` intacto.** Adiciona algo como `generateText(prompt, context): Promise<AiGenerationResult>` à interface em `ai-analysis/ai-provider.interface.ts` (ou um novo arquivo de interface irmão, dependendo de quanto o contrato diverge), implementado no mesmo `GeminiProvider` já existente — reaproveita a integração e credenciais já configuradas (`GOOGLE_AI_API_KEY`), sem introduzir um segundo cliente de IA no projeto.

## Risks / Trade-offs

- [Perguntas fixas por seção podem não fazer sentido para todo tipo de edital (ex.: um edital sem exigência de contrapartida ainda mostra a pergunta de contrapartida)] → Mitigação: aceito para o MVP; o texto gerado pode orientar o usuário a responder "não aplicável" quando for o caso, e isso pode ser refinado com feedback real de uso.
- [Usuário mal-intencionado tenta prompt injection via respostas do formulário ou via pergunta do tira-dúvidas] → Mitigação: todo texto do usuário entra no prompt sob a mesma regra "dado, nunca instrução" já validada no pipeline de extração; adicionalmente, respostas e perguntas têm limite de tamanho de caracteres validado no backend antes de chegar ao prompt.
- [Limite de 3 perguntas por edital pode ser insuficiente e frustrar o usuário] → Mitigação: é um ponto de partida conservador por causa do custo de API; fácil de ajustar via configuração depois de observar uso real, sem mudança estrutural.
- [Geração de texto por seção falha ou retorna erro da IA] → Mitigação: segue o mesmo padrão de tratamento de erro já usado em `ai-analysis` (`errorMessage`, status de falha), sem consumir o limite de regenerações do usuário nesse caso.

## Migration Plan

1. Migration Prisma: novas tabelas `ProjectDraft`, `ProjectDraftSection` (ou nome equivalente) e `ProjectDraftQuestion` (tira-dúvidas, com contador), todas vinculadas a `User` e `Opportunity` — aditivo, não afeta tabelas existentes.
2. Deploy do backend com o novo módulo e a extensão do `AiProvider` — não altera o comportamento de `ai-analysis` existente.
3. Deploy do frontend com a entrada do wizard a partir de `OpportunityDetailPage` — rota nova, não altera páginas existentes.
4. Rollback: novas tabelas podem ser removidas sem impacto em dados existentes; novo módulo pode ser desativado sem afetar extração/scraping.

## Open Questions

- Qual o limite exato de regenerações por seção (análogo às 3 perguntas do tira-dúvidas)? Pode ser decidido durante a implementação com um valor conservador configurável, sem bloquear o design.
