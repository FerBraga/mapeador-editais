## Why

O descritivo de produto do MVP define o "Copiloto de Escrita" como a funcionalidade central para democratizar o acesso a editais: guiar o proponente, mesmo sem experiência técnica, na elaboração do texto do projeto (justificativa, objetivos, contrapartidas, orçamento básico), alinhado às exigências do edital selecionado. Hoje o pipeline de IA do projeto (`ai-analysis`) só faz extração estruturada de informações do edital (`AIAnalysis`/`OpportunityExtractionSchema`) — não existe nenhuma funcionalidade voltada a ajudar o usuário a redigir o próprio projeto. Esta change constrói esse fluxo, reaproveitando a extração já feita como contexto para a geração de texto.

Por decisão explícita do usuário, o fluxo é **guiado e de baixa agência**, não um chat livre: um conjunto fixo de perguntas objetivas por seção, a IA redige o texto da seção a partir das respostas, e o usuário copia/edita o resultado por fora. Isso limita a superfície de entrada livre do usuário (menor custo de API, menor exposição a prompt injection) e mantém o produto simples de usar.

## What Changes

- Adiciona um fluxo de wizard por seção (justificativa, objetivos, contrapartidas, orçamento básico) para um edital já presente na base e com extração de IA concluída (`AIAnalysis` `COMPLETED`).
- Cada seção apresenta um conjunto fixo e curto de perguntas objetivas (campos de texto curto/seleção, não um chat aberto); o usuário responde todas as perguntas da seção de uma vez.
- Ao enviar as respostas de uma seção, o backend chama a IA generativa para redigir o texto daquela seção, usando como contexto: as respostas do usuário + os dados já extraídos do edital (objeto, público-alvo, critérios de elegibilidade, restrições). O texto gerado é salvo e exibido ao usuário, que pode copiá-lo.
- Persiste o progresso do usuário por edital (rascunho com respostas e textos gerados por seção), associado à conta do proponente (depende da change `autenticacao-proponentes`), recuperável se o usuário sair e voltar.
- Aplica mitigação de prompt injection no prompt de geração, seguindo o padrão já usado em `ai-analysis/prompt.ts` (conteúdo do edital e respostas do usuário são sempre tratados como dado, nunca como instrução) e validando/sanitizando as entradas do usuário antes de incluí-las no prompt.
- Aplica limite de geração por seção (ex.: X regenerações permitidas por seção) para conter custo de API e abuso — não é um chat onde o usuário pode gerar indefinidamente.
- Adiciona um "tira-dúvidas" sobre o edital: o usuário pode fazer uma pergunta pontual em texto livre (ex.: "posso me inscrever sendo MEI?"), respondida pela IA usando como contexto apenas os dados já extraídos daquele edital (`AIAnalysis`). Limitado a um número fixo de perguntas por usuário/edital (ex.: 3) — ao atingir o limite, a ação fica bloqueada para aquele edital. É a única entrada de texto livre do fluxo, então recebe o mesmo tratamento de dado-nunca-instrução do restante do prompt, reforçado por ser a superfície mais exposta a prompt injection.
- **Fora de escopo nesta change**: upload de PDF avulso (só funciona com editais já extraídos pela base, por decisão do usuário), exportação formatada (PDF/docx) do projeto final — o usuário copia o texto manualmente — e qualquer edição colaborativa ou histórico de versões além do texto mais recente gerado por seção.

## Capabilities

### New Capabilities
- `project-writing-wizard`: fluxo guiado por seções que coleta respostas objetivas do proponente e usa IA generativa para redigir o texto do projeto alinhado ao edital selecionado, com persistência de rascunho por usuário/edital, um tira-dúvidas limitado sobre o edital, e controles de limite de uso e mitigação de prompt injection.

### Modified Capabilities
(nenhuma — a capacidade de extração `ai-structured-extraction` é apenas consumida como contexto, sem alteração de seus requisitos)

## Impact

- Novo módulo backend (ex.: `backend/src/modules/project-drafts/` ou similar) com endpoints protegidos pelo guard JWT da change `autenticacao-proponentes` (dependência direta — este fluxo não existe sem usuário autenticado).
- Novas tabelas no Prisma: rascunho de projeto (`ProjectDraft`, vinculado a `User` e `Opportunity`), suas seções (respostas estruturadas + texto gerado + metadados de geração), e o histórico de perguntas do tira-dúvidas (pergunta + resposta + contador por usuário/edital).
- Extensão do `AiProvider` (hoje só tem `extract()` em `ai-analysis/ai-provider.interface.ts`) com um método de geração de texto, implementado no provider já existente (Gemini).
- Novas rotas/telas no frontend: entrada do wizard a partir da página de detalhe do edital (`OpportunityDetailPage`), formulários por seção, exibição do texto gerado com ação de copiar.
- Dependência direta da change `autenticacao-proponentes` (precisa de usuário logado para salvar o rascunho).
