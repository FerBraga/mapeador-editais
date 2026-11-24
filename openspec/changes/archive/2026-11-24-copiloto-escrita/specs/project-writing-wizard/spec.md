## ADDED Requirements

### Requirement: Início do wizard sobre um edital da base
O sistema SHALL permitir que um proponente autenticado inicie o wizard de escrita para um edital que já possui uma `AIAnalysis` com status `COMPLETED`. O sistema SHALL impedir o início do wizard para editais sem extração de IA concluída.

#### Scenario: Início bem-sucedido
- **WHEN** um proponente autenticado seleciona um edital com `AIAnalysis` `COMPLETED` e inicia o wizard
- **THEN** o sistema cria (ou recupera, se já existir) um rascunho de projeto vinculado àquele usuário e àquele edital

#### Scenario: Edital sem extração concluída
- **WHEN** um proponente autenticado tenta iniciar o wizard para um edital sem `AIAnalysis` `COMPLETED`
- **THEN** o sistema rejeita a ação e informa que o edital ainda não está pronto para o wizard

### Requirement: Perguntas fechadas por seção
Para cada seção do projeto (justificativa, objetivos, contrapartidas, orçamento básico), o sistema SHALL apresentar um conjunto fixo e predefinido de perguntas objetivas. O sistema SHALL NOT oferecer um campo de conversa livre para compor o texto da seção.

#### Scenario: Exibição das perguntas de uma seção
- **WHEN** o proponente abre uma seção do wizard
- **THEN** o sistema exibe o conjunto fixo de perguntas daquela seção, pré-preenchidas com respostas salvas anteriormente, se houver

### Requirement: Geração de texto da seção
Ao receber as respostas de uma seção, o sistema SHALL gerar o texto daquela seção via IA generativa, usando como contexto as respostas do usuário e os dados já extraídos do edital (`AIAnalysis`), e SHALL salvar o texto gerado associado àquela seção do rascunho. O sistema SHALL tratar o conteúdo das respostas do usuário e os dados extraídos do edital como dado, nunca como instrução, ao montar o prompt de geração.

#### Scenario: Geração bem-sucedida
- **WHEN** o proponente envia respostas válidas para todas as perguntas obrigatórias de uma seção
- **THEN** o sistema gera e salva o texto da seção, e o exibe ao usuário com uma ação de copiar

#### Scenario: Respostas incompletas
- **WHEN** o proponente envia uma seção sem responder uma pergunta obrigatória
- **THEN** o sistema rejeita o envio e indica quais perguntas obrigatórias faltam, sem chamar a IA

#### Scenario: Falha na geração
- **WHEN** a chamada à IA para gerar o texto da seção falha ou retorna erro
- **THEN** o sistema informa o erro ao usuário, não salva um texto de seção inválido, e não consome o limite de regenerações do usuário

### Requirement: Limite de regenerações por seção
O sistema SHALL limitar o número de vezes que o texto de uma mesma seção pode ser regenerado por um mesmo usuário, validado no backend.

#### Scenario: Regeneração dentro do limite
- **WHEN** o proponente pede para regenerar o texto de uma seção e ainda não atingiu o limite configurado para aquela seção
- **THEN** o sistema gera um novo texto, substitui o texto salvo da seção, e incrementa o contador de regenerações

#### Scenario: Limite de regenerações atingido
- **WHEN** o proponente pede para regenerar o texto de uma seção já no limite configurado
- **THEN** o sistema rejeita a ação, informa que o limite foi atingido, e não chama a IA

### Requirement: Persistência do rascunho
O sistema SHALL persistir o rascunho de projeto (respostas de cada seção e os textos gerados) associado ao usuário e ao edital, recuperável em sessões futuras.

#### Scenario: Retomada do rascunho
- **WHEN** um proponente autenticado volta ao wizard de um edital para o qual já tinha um rascunho em andamento
- **THEN** o sistema carrega as respostas e os textos já gerados anteriormente, permitindo continuar de onde parou

### Requirement: Tira-dúvidas sobre o edital
O sistema SHALL permitir que o proponente faça perguntas pontuais, em texto livre, sobre um edital para o qual está usando o wizard, respondidas pela IA usando exclusivamente os dados já extraídos daquele edital (`AIAnalysis`) como contexto. O sistema SHALL tratar o texto da pergunta do usuário como dado, nunca como instrução, ao montar o prompt de resposta.

#### Scenario: Pergunta respondida com sucesso
- **WHEN** o proponente envia uma pergunta sobre um edital para o qual ainda não atingiu o limite de perguntas
- **THEN** o sistema gera uma resposta via IA com base nos dados extraídos do edital, salva o par pergunta/resposta, e incrementa o contador de perguntas daquele usuário para aquele edital

#### Scenario: Limite de perguntas atingido
- **WHEN** o proponente já atingiu o número máximo de perguntas permitidas para aquele edital (ex.: 3)
- **THEN** o sistema rejeita o envio de uma nova pergunta, informa que o limite foi atingido, e não chama a IA

#### Scenario: Pergunta vazia ou excessivamente longa
- **WHEN** o proponente envia uma pergunta vazia ou que excede o tamanho máximo de caracteres permitido
- **THEN** o sistema rejeita o envio com erro de validação, sem consumir o limite de perguntas e sem chamar a IA
